import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: {
    getRoot: () => string;
    getPublicHealth: jest.Mock;
  };

  beforeEach(async () => {
    healthService = {
      getRoot: () => 'ZAY API is running',
      getPublicHealth: jest.fn().mockResolvedValue({ status: 'ok' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: healthService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('returns API running message', () => {
    expect(controller.getRoot()).toBe('ZAY API is running');
  });

  it('returns public health status only', async () => {
    await expect(controller.getHealth()).resolves.toEqual({ status: 'ok' });
  });

  it('throws 503 when public health is not ok', async () => {
    healthService.getPublicHealth.mockResolvedValue({ status: 'error' });
    await expect(controller.getHealth()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
