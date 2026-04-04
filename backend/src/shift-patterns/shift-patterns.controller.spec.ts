import { Test, TestingModule } from '@nestjs/testing';
import { ShiftPatternsController } from './shift-patterns.controller';

describe('ShiftPatternsController', () => {
  let controller: ShiftPatternsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShiftPatternsController],
    }).compile();

    controller = module.get<ShiftPatternsController>(ShiftPatternsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
