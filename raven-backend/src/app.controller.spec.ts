import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health/health.controller';
import { DbModule } from './db/db.module';

describe('HealthController', () => {
  let healthController: HealthController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [DbModule],
      controllers: [HealthController],
    }).compile();

    healthController = app.get<HealthController>(HealthController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(healthController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('should return health status UP', () => {
      const result = healthController.getHealth();
      expect(result.status).toBe('UP');
      expect(result.systemMetrics).toBeDefined();
      expect(result.persistence).toBeDefined();
      expect(result.uptimeSeconds).toBeGreaterThanOrEqual(0);
    });
  });
});
