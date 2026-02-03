
import { Controller, Get, Param, Patch, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessagesService } from './messages.service';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('chats')
  getRecentChats(@Request() req) {
    return this.messagesService.getRecentChats(req.user.userId);
  }

  @Get('conversation/:otherUserId')
  getConversation(@Request() req, @Param('otherUserId') otherUserId: string) {
    return this.messagesService.getConversation(req.user.userId, otherUserId);
  }

  @Patch('read/:senderId')
  markAsRead(@Request() req, @Param('senderId') senderId: string) {
    return this.messagesService.markAsRead(req.user.userId, senderId);
  }
}
