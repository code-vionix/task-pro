
import { Module } from '@nestjs/common';
import { MessagesModule } from '../messages/messages.module';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [MessagesModule],
  providers: [ChatGateway, PrismaService],
})
export class ChatModule {}
