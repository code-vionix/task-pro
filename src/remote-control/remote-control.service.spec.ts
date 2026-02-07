import { Test, TestingModule } from '@nestjs/testing';
import { RemoteControlService } from './remote-control.service';

describe('RemoteControlService', () => {
  let service: RemoteControlService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RemoteControlService],
    }).compile();

    service = module.get<RemoteControlService>(RemoteControlService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
