import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: {
            getRoot: () => 'ZAY API is running',
            getHealth: async () => ({
              status: 'ok',
              service: 'backend-zay',
              database: 'up',
              timestamp: '2026-01-01T00:00:00.000Z',
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('returns API running message', () => {
    expect(controller.getRoot()).toBe('ZAY API is running');
  });
});
