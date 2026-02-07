import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RemoteControlController } from './remote-control.controller';
import { RemoteControlGateway } from './remote-control.gateway';
import { RemoteControlService } from './remote-control.service';

@Module({
  imports: [PrismaModule],
  controllers: [RemoteControlController],
  providers: [RemoteControlService, RemoteControlGateway],
  exports: [RemoteControlService],
})
export class RemoteControlModule {}
