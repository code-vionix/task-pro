import { Body, Controller, Get, Param, Patch, Post, Request, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CloudinaryService } from '../common/cloudinary.service';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('profile')
  getOwnProfile(@Request() req) {
    return this.usersService.findProfile(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findProfile(id);
  }

  @Patch('profile')
  update(@Request() req, @Body() updateDto: { bio?: string; avatarUrl?: string; coverImageUrl?: string; coverPosition?: any; avatarPosition?: any }) {
    return this.usersService.update(req.user.userId, updateDto);
  }

  @Post('upload-avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    const url = await this.cloudinaryService.uploadImage(file);
    await this.usersService.update(req.user.userId, { avatarUrl: url });
    return { url };
  }

  @Post('upload-cover')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCover(@Request() req, @UploadedFile() file: Express.Multer.File) {
    const url = await this.cloudinaryService.uploadImage(file);
    await this.usersService.update(req.user.userId, { coverImageUrl: url });
    return { url };
  }
}
