import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { SupabaseStorageService } from './supabase-storage.service';

/** Private storage metadata and signed-access policy. */
@Module({
  imports: [PrismaModule],
  controllers: [FilesController],
  providers: [FilesService, SupabaseStorageService],
  exports: [FilesService],
})
export class FilesModule {}
