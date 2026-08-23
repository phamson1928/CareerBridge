import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { FileType, PlacementStatus, Prisma, ReportStatus, Role, SupervisionStatus } from '../generated/prisma/client';
import type { AuthUser } from '../auth/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ListReportsQueryDto } from './dto/list-reports-query.dto';
import { ReviewReportDto } from './dto/review-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';

const select = { id:true, placementId:true, week:true, title:true, content:true, fileId:true, status:true, feedback:true, submittedAt:true, reviewedAt:true, createdAt:true, updatedAt:true, file:{select:{id:true,originalName:true,mimeType:true,sizeBytes:true}}, placement:{select:{id:true,status:true,student:{select:{id:true,userId:true,studentCode:true,fullName:true}}, company:{select:{companyName:true}}, internship:{select:{title:true}}, semester:{select:{name:true}}, supervision:{select:{status:true,lecturer:{select:{userId:true,fullName:true}}}}}} } satisfies Prisma.ReportSelect;
type ReportRecord = Prisma.ReportGetPayload<{select: typeof select}>;

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateReportDto, user: AuthUser) {
    await this.studentPlacement(dto.placementId, user.id);
    await this.validateFile(dto.fileId, user.id);
    try { const report = await this.prisma.report.create({ data:{ placementId:dto.placementId, week:dto.week, title:dto.title?.trim(), content:dto.content.trim(), fileId:dto.fileId }, select }); return report; }
    catch (e) { this.known(e); }
  }
  async listStudent(query: ListReportsQueryDto, user: AuthUser) { return this.list(query, { placement:{student:{userId:user.id}} }); }
  async listSupervised(query: ListReportsQueryDto, user: AuthUser) { return this.list(query, { placement:{supervision:{is:{lecturer:{userId:user.id},status:SupervisionStatus.ACTIVE}}} }); }
  async findOne(id: string, user: AuthUser) { const report=await this.prisma.report.findUnique({where:{id},select}); if(!report) throw this.notFound(); this.access(report,user); return report; }
  async update(id:string,dto:UpdateReportDto,user:AuthUser) { const current=await this.findOne(id,user); if(current.placement.student.userId!==user.id) throw this.denied(); if(current.status!==ReportStatus.DRAFT && current.status!==ReportStatus.REJECTED) throw this.conflict('REPORT_NOT_EDITABLE','Only draft or rejected reports can be edited'); if(dto.fileId!==undefined) await this.validateFile(dto.fileId ?? undefined,user.id); return this.prisma.report.update({where:{id},data:{title:dto.title?.trim(),content:dto.content?.trim(),fileId:dto.fileId},select}); }
  async submit(id:string,user:AuthUser) { const current=await this.findOne(id,user); if(current.placement.student.userId!==user.id) throw this.denied(); if(current.status!==ReportStatus.DRAFT && current.status!==ReportStatus.REJECTED) throw this.conflict('INVALID_REPORT_TRANSITION','Only draft or rejected reports can be submitted'); const report=await this.prisma.report.update({where:{id},data:{status:ReportStatus.SUBMITTED,submittedAt:new Date(),reviewedAt:null,feedback:null},select}); await this.audit(user.id,'REPORT_SUBMITTED',id,{placementId:report.placementId,week:report.week}); return report; }
  async review(id:string,dto:ReviewReportDto,user:AuthUser) { const current=await this.findOne(id,user); if(current.placement.supervision?.lecturer.userId!==user.id || current.placement.supervision.status!==SupervisionStatus.ACTIVE) throw this.denied(); if(current.status!==ReportStatus.SUBMITTED) throw this.conflict('INVALID_REPORT_TRANSITION','Only submitted reports can be reviewed'); const report=await this.prisma.report.update({where:{id},data:{status:dto.status,feedback:dto.feedback?.trim() ?? null,reviewedAt:new Date()},select}); await this.audit(user.id, dto.status==='APPROVED'?'REPORT_APPROVED':'REPORT_REJECTED',id,{placementId:report.placementId}); return report; }

  private async list(query:ListReportsQueryDto, scope:Prisma.ReportWhereInput) { const where:Prisma.ReportWhereInput={...scope,...(query.status?{status:query.status}:{}),...(query.placementId?{placementId:query.placementId}:{})}; const [items,total]=await this.prisma.$transaction([this.prisma.report.findMany({where,select,orderBy:[{submittedAt:'desc'},{createdAt:'desc'}],skip:(query.page-1)*query.limit,take:query.limit}),this.prisma.report.count({where})]); return {items,pagination:{page:query.page,limit:query.limit,total,totalPages:Math.ceil(total/query.limit)}}; }
  private async studentPlacement(placementId:string,userId:string) { const p=await this.prisma.internshipPlacement.findFirst({where:{id:placementId,student:{userId}},select:{status:true}}); if(!p) throw this.denied(); if(p.status!==PlacementStatus.ACTIVE) throw this.conflict('PLACEMENT_NOT_ACTIVE','Reports require an active placement'); }
  private async validateFile(fileId:string|undefined,userId:string) { if(!fileId) return; const f=await this.prisma.file.findFirst({where:{id:fileId,ownerId:userId,type:FileType.REPORT},select:{id:true}}); if(!f) throw new NotFoundException({code:'REPORT_FILE_NOT_FOUND',message:'Report file not found or not owned by student'}); }
  private access(r:ReportRecord,u:AuthUser) { if(u.role===Role.ADMIN || r.placement.student.userId===u.id || r.placement.supervision?.lecturer.userId===u.id) return; throw this.denied(); }
  private async audit(userId:string,action:string,entityId:string,metadata:Prisma.InputJsonValue){await this.prisma.auditLog.create({data:{userId,action,entity:'Report',entityId,metadata}});}
  private notFound(){return new NotFoundException({code:'REPORT_NOT_FOUND',message:'Report not found'});} private denied(){return new ForbiddenException({code:'REPORT_NOT_ACCESSIBLE',message:'Report is not accessible'});} private conflict(code:string,message:string){return new ConflictException({code,message});} private known(e:unknown):never {if(e instanceof Prisma.PrismaClientKnownRequestError&&e.code==='P2002') throw this.conflict('REPORT_WEEK_ALREADY_EXISTS','A report already exists for this placement and week'); throw e;}
}
