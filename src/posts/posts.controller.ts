import { Body, Controller, Delete, Get, Param, Post, Request, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReactionType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CloudinaryService } from '../common/cloudinary.service';
import { PostsService } from './posts.service';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(
      private readonly postsService: PostsService,
      private readonly cloudinaryService: CloudinaryService
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(@Request() req, @Body() createPostDto: any, @UploadedFile() file: Express.Multer.File) {
    let imageUrl = createPostDto.imageUrl;
    if (file) {
        imageUrl = await this.cloudinaryService.uploadImage(file);
    }
    return this.postsService.create(req.user.userId, { ...createPostDto, imageUrl });
  }

  @Get()
  findAll() {
    return this.postsService.findAll();
  }

  @Post(':id/react')
  react(@Request() req, @Param('id') id: string, @Body('type') type: ReactionType) {
      return this.postsService.addReaction(req.user.userId, id, type);
  }

  @Post(':id/comment')
  comment(@Request() req, @Param('id') id: string, @Body('content') content: string, @Body('parentId') parentId?: string) {
      return this.postsService.addComment(req.user.userId, id, content, parentId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postsService.remove(id); // Access control can be added (e.g. only owner or admin)
  }
}
