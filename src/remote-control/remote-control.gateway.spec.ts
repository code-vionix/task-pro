import { Test, TestingModule } from '@nestjs/testing';
import { RemoteControlGateway } from './remote-control.gateway';

describe('RemoteControlGateway', () => {
  let gateway: RemoteControlGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RemoteControlGateway],
    }).compile();

    gateway = module.get<RemoteControlGateway>(RemoteControlGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
