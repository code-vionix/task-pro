
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async getConversation(userId: string, otherUserId: string) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, email: true, avatarUrl: true, avatarPosition: true, isOnline: true } },
        reactions: true,
      },
    });
  }

  async getRecentChats(userId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, email: true, avatarUrl: true, avatarPosition: true, isOnline: true, lastSeen: true } },
        receiver: { select: { id: true, email: true, avatarUrl: true, avatarPosition: true, isOnline: true, lastSeen: true } },
        reactions: true,
      },
    });

    const chatPartners = new Map();
    
    // Get unread counts
    const unreadCounts = await this.prisma.message.groupBy({
      by: ['senderId'],
      where: {
        receiverId: userId,
        isRead: false,
      },
      _count: true,
    });

    const unreadMap = new Map(unreadCounts.map(c => [c.senderId, c._count]));

    messages.forEach((msg) => {
      const partner = msg.senderId === userId ? msg.receiver : msg.sender;
      if (!chatPartners.has(partner.id)) {
        chatPartners.set(partner.id, {
          ...partner,
          lastMessage: msg.content,
          lastTimestamp: msg.createdAt,
          unreadCount: unreadMap.get(partner.id) || 0,
        });
      }
    });

    return Array.from(chatPartners.values());
  }

  async markAsRead(userId: string, senderId: string) {
    return this.prisma.message.updateMany({
      where: {
        senderId,
        receiverId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  async remove(id: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id },
    });

    if (!message) throw new Error('Message not found');

    // Only sender can delete/unsend
    if (message.senderId !== userId) {
      throw new Error('You are not authorized to delete this message');
    }

    return this.prisma.message.delete({ where: { id } });
  }
}
