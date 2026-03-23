import { Test, TestingModule } from '@nestjs/testing';
import { ShiftTypesController } from './shift-types.controller';

describe('ShiftTypesController', () => {
  let controller: ShiftTypesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShiftTypesController],
    }).compile();

    controller = module.get<ShiftTypesController>(ShiftTypesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
