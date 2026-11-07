import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermission } from '../common/decorators/admin-permissions.decorator';
import { AdminPermission } from '../common/constants/admin-permissions.constants';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../generated/prisma/client';
import { CreateSkillDto } from './dto/create-skill.dto';
import { ListSkillsQueryDto } from './dto/list-skills-query.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { SkillsService } from './skills.service';

@Controller('skills')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get()
  list(@Query() query: ListSkillsQueryDto) {
    return this.skillsService.list(query);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.skillsService.findById(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  @RequirePermission(AdminPermission.INTERNSHIPS)
  create(@Body() dto: CreateSkillDto) {
    return this.skillsService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @RequirePermission(AdminPermission.INTERNSHIPS)
  update(@Param('id') id: string, @Body() dto: UpdateSkillDto) {
    return this.skillsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @RequirePermission(AdminPermission.INTERNSHIPS)
  remove(@Param('id') id: string) {
    return this.skillsService.remove(id);
  }
}
