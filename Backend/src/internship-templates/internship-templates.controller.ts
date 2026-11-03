import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../generated/prisma/client';
import { CreateInternshipFromTemplateDto } from './dto/create-internship-from-template.dto';
import { CreateInternshipTemplateDto } from './dto/create-internship-template.dto';
import { UpdateInternshipTemplateDto } from './dto/update-internship-template.dto';
import { InternshipTemplatesService } from './internship-templates.service';

@Controller('internship-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InternshipTemplatesController {
  constructor(private readonly templatesService: InternshipTemplatesService) {}

  @Get('me')
  @Roles(Role.COMPANY)
  listMine(@CurrentUser() user: AuthUser) {
    return this.templatesService.listMine(user.id);
  }

  @Get(':id')
  @Roles(Role.COMPANY)
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.templatesService.findOne(id, user.id);
  }

  @Post()
  @Roles(Role.COMPANY)
  create(
    @Body() dto: CreateInternshipTemplateDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.templatesService.create(user.id, dto);
  }

  @Patch(':id')
  @Roles(Role.COMPANY)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInternshipTemplateDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.templatesService.update(id, user.id, dto);
  }

  @Delete(':id')
  @Roles(Role.COMPANY)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.templatesService.remove(id, user.id);
  }

  @Post(':id/create-internship')
  @Roles(Role.COMPANY)
  createInternship(
    @Param('id') id: string,
    @Body() dto: CreateInternshipFromTemplateDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.templatesService.createInternship(id, user.id, dto);
  }
}
