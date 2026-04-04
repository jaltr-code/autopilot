import { Test, TestingModule } from '@nestjs/testing';
import { ShiftPatternsService } from './shift-patterns.service';

describe('ShiftPatternsService', () => {
  let service: ShiftPatternsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShiftPatternsService],
    }).compile();

    service = module.get<ShiftPatternsService>(ShiftPatternsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
