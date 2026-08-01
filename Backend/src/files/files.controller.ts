import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';
import { FilesService } from './files.service';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload-url')
  createUploadUrl(
    @Body() dto: CreateUploadUrlDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.filesService.createUploadUrl(dto, user);
  }

  @Get(':id/download-url')
  createDownloadUrl(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.filesService.createDownloadUrl(id, user);
  }
}
