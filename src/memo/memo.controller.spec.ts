import { Test, TestingModule } from '@nestjs/testing';
import { MemoController } from './memo.controller';
import { MemoService } from './memo.service';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';
import { Types } from 'mongoose';

describe('MemoController', () => {
  let controller: MemoController;

  const mockMemo = {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(),
    scheduledDate: new Date('2025-07-06'),
    content: 'Test Memo',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MemoController],
      providers: [
        {
          provide: MemoService,
          useValue: {
            createMemo: jest.fn().mockResolvedValue(mockMemo),
            getMemoByDate: jest.fn().mockResolvedValue(mockMemo),
            getAllMemos: jest.fn().mockResolvedValue([mockMemo]),
            updateMemo: jest.fn().mockResolvedValue(mockMemo),
            deleteMemo: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest();
          request.user = { _id: new Types.ObjectId() }; // Mock user
          return true;
        },
      })
      .compile();

    controller = module.get<MemoController>(MemoController);
    module.get<MemoService>(MemoService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create or update a memo', async () => {
    const dto = { scheduledDate: '2025-07-06', content: 'New Memo' };
    expect(
      await controller.createOrUpdateMemo({ _id: new Types.ObjectId() }, dto),
    ).toEqual(mockMemo);
    expect(service.createMemo).toHaveBeenCalledWith(
      expect.any(Types.ObjectId),
      dto,
    );
  });

  it('should get a memo by date', async () => {
    const date = '2025-07-06';
    expect(
      await controller.getMemoByDate({ _id: new Types.ObjectId() }, date),
    ).toEqual(mockMemo);
    expect(service.getMemoByDate).toHaveBeenCalledWith(
      expect.any(Types.ObjectId),
      new Date(date),
    );
  });

  it('should get all memos', async () => {
    const filterDto = {};
    expect(
      await controller.getAllMemos({ _id: new Types.ObjectId() }, filterDto),
    ).toEqual([mockMemo]);
    expect(service.getAllMemos).toHaveBeenCalledWith(
      expect.any(Types.ObjectId),
      filterDto,
    );
  });

  it('should update a memo', async () => {
    const memoId = mockMemo._id.toHexString();
    const dto = { content: 'Updated Content' };
    expect(
      await controller.updateMemo({ _id: new Types.ObjectId() }, memoId, dto),
    ).toEqual(mockMemo);
    expect(service.updateMemo).toHaveBeenCalledWith(
      expect.any(Types.ObjectId),
      memoId,
      dto,
    );
  });

  it('should delete a memo', async () => {
    const memoId = mockMemo._id.toHexString();
    await controller.deleteMemo({ _id: new Types.ObjectId() }, memoId);
    expect(service.deleteMemo).toHaveBeenCalledWith(
      expect.any(Types.ObjectId),
      memoId,
    );
  });
});
