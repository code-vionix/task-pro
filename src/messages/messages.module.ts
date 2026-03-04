import { Module } from '@nestjs/common';
import { CloudinaryService } from '../common/cloudinary.service';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
  controllers: [MessagesController],
  providers: [MessagesService, PrismaService, CloudinaryService],
  exports: [MessagesService],
})
export class MessagesModule {}
