import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RemoteControlController } from './remote-control.controller';
import { RemoteControlGateway } from './remote-control.gateway';
import { RemoteControlService } from './remote-control.service';

import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey',
      signOptions: { expiresIn: '365d' },
    }),
  ],
  controllers: [RemoteControlController],
  providers: [RemoteControlService, RemoteControlGateway],
  exports: [RemoteControlService],
})
export class RemoteControlModule {}
