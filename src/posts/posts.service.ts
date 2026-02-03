import { Injectable, NotFoundException } from '@nestjs/common';
import { ReactionType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(userId: string, createPostDto: any) {
    return this.prisma.post.create({
      data: {
        content: createPostDto.content,
        imageUrl: createPostDto.imageUrl,
        userId,
      },
      include: { user: { select: { id: true, email: true, role: true } } }
    });
  }

  async findAll() {
    return this.prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, role: true, avatarUrl: true, avatarPosition: true, coverPosition: true } },
        _count: { select: { comments: true } },
        reactions: true,
        comments: {
           include: { 
               user: { select: { id: true, email: true } },
               replies: { include: { user: { select: { id: true, email: true } } } }
           },
           orderBy: { createdAt: 'asc' },
           where: { parentId: null } // Only top-level comments initially
        }
      },
    });
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true } },
        comments: { include: { user: { select: { id: true, email: true } } } },
        reactions: true
      }
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async addReaction(userId: string, postId: string, type: ReactionType) {
      // Find post to get owner and info
      const post = await this.prisma.post.findUnique({
          where: { id: postId },
          include: { user: true }
      });
      if (!post) throw new NotFoundException('Post not found');

      // Check if reaction exists
      const existing = await this.prisma.reaction.findUnique({
          where: { userId_postId: { userId, postId } }
      });

      let result;
      if (existing) {
          if (existing.type === type) {
              // Toggle off
              result = await this.prisma.reaction.delete({ where: { id: existing.id } });
          } else {
              // Update type
              result = await this.prisma.reaction.update({
                  where: { id: existing.id },
                  data: { type }
              });
          }
      } else {
          result = await this.prisma.reaction.create({ data: { userId, postId, type } });
          
          // Notify owner if it's not their own post
          if (post.userId !== userId) {
             const sender = await this.prisma.user.findUnique({ where: { id: userId } });
             await this.notifications.create({
                 userId: post.userId,
                 type: 'REACTION',
                 message: `${sender?.email.split('@')[0]} liked your post`,
                 data: { postId }
             });
          }
      }

      return result;
  }

  async addComment(userId: string, postId: string, content: string, parentId?: string) {
      const comment = await this.prisma.comment.create({
          data: { content, userId, postId, parentId },
          include: { 
              user: { select: { id: true, email: true } },
              post: { include: { user: true } }
          }
      });

      // Notify post owner
      if (comment.post.userId !== userId) {
          await this.notifications.create({
              userId: comment.post.userId,
              type: 'COMMENT',
              message: `${comment.user.email.split('@')[0]} commented on your post`,
              data: { postId, commentId: comment.id }
          });
      }

      return comment;
  }

  remove(id: string) {
    return this.prisma.post.delete({ where: { id } });
  }
}
