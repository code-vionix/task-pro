// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { CloudinaryService } from '../common/cloudinary.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
    imports: [PrismaModule],
    controllers: [UsersController],
    providers: [UsersService, PrismaService, CloudinaryService],
    exports: [UsersService],
})
export class UsersModule { }
