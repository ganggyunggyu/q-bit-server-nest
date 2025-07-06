import { Test, TestingModule } from '@nestjs/testing';
import { MemoService } from './memo.service';
import { getModelToken } from '@nestjs/mongoose';
import { Memo, MemoDocument } from './schema/memo.schema';
import { Model, Types } from 'mongoose';
import { NotFoundException } from '@nestjs/common';

interface MockMemoData {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  scheduledDate: Date;
  content: string;
  createDate: Date;
}

interface MockMemoDocument extends MockMemoData {
  save: jest.Mock;
}

describe('MemoService', () => {
  let service: MemoService;
  let memoModel: Model<MemoDocument>;

  const mockMemoData: MockMemoData = {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(),
    scheduledDate: new Date('2025-07-06'),
    content: 'Test Memo',
    createDate: new Date(),
  };

  // This represents a Mongoose Document instance with a save method
  const createMockMemoDocument = (
    data: MockMemoData = mockMemoData,
  ): MockMemoDocument => ({
    ...data,
    save: jest.fn().mockResolvedValue(data),
  });

  // This represents the Mongoose Model with its static methods
  const mockMemoModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemoService,
        {
          provide: getModelToken(Memo.name),
          useValue: mockMemoModel,
        },
      ],
    }).compile();

    service = module.get<MemoService>(MemoService);
    memoModel = module.get<Model<MemoDocument>>(getModelToken(Memo.name));

    // Reset mocks before each test
    jest.clearAllMocks();

    // Default mock implementations for chainable methods
    mockMemoModel.find.mockImplementation(() => ({
      lean: jest.fn().mockResolvedValue([mockMemoData]),
      exec: jest.fn().mockResolvedValue([mockMemoData]),
    }));
    mockMemoModel.findOne.mockImplementation(() => ({
      lean: jest.fn().mockResolvedValue(mockMemoData),
      exec: jest.fn().mockResolvedValue(mockMemoData),
    }));
    mockMemoModel.findOneAndUpdate.mockImplementation(() => ({
      lean: jest.fn().mockResolvedValue(mockMemoData),
      exec: jest.fn().mockResolvedValue(mockMemoData),
    }));
    mockMemoModel.deleteOne.mockImplementation(() => ({
      lean: jest
        .fn()
        .mockResolvedValue({ acknowledged: true, deletedCount: 1 }),
      exec: jest
        .fn()
        .mockResolvedValue({ acknowledged: true, deletedCount: 1 }),
    }));
    mockMemoModel.countDocuments.mockImplementation(() => ({
      lean: jest.fn().mockResolvedValue(1),
      exec: jest.fn().mockResolvedValue(1),
    }));
    mockMemoModel.create.mockImplementation((data: MockMemoData) =>
      createMockMemoDocument(data),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a memo if not exists', async () => {
    const userId = new Types.ObjectId();
    const dto = { scheduledDate: '2025-07-06', content: 'New Memo' };

    // Mock findOne to return null (memo does not exist)
    (memoModel.findOne as jest.Mock).mockResolvedValueOnce(null); // Direct return for findOne without .lean()

    // Mock create to return a new document with a save method
    const newMockDoc = createMockMemoDocument({
      userId,
      scheduledDate: new Date('2025-07-06T00:00:00.000Z'),
      content: 'New Memo',
      createDate: expect.any(Date), // createDate is set by Mongoose
    });
    (memoModel.create as jest.Mock).mockResolvedValueOnce(newMockDoc);

    const result = await service.createMemo(userId, dto);
    expect(result).toEqual(newMockDoc);
    expect(memoModel.findOne).toHaveBeenCalledWith({
      userId,
      scheduledDate: new Date('2025-07-06T00:00:00.000Z'),
    });
    expect(memoModel.create).toHaveBeenCalledWith({
      userId,
      scheduledDate: new Date('2025-07-06T00:00:00.000Z'),
      content: 'New Memo',
    });
    expect(newMockDoc.save).toHaveBeenCalled();
  });

  it('should update a memo if exists', async () => {
    const userId = new Types.ObjectId();
    const dto = { scheduledDate: '2025-07-06', content: 'Updated Memo' };

    // Mock findOne to return an existing memo document with a save method
    const existingMockDoc = createMockMemoDocument({
      ...mockMemoData,
      content: 'Original Memo',
    });
    (memoModel.findOne as jest.Mock).mockResolvedValueOnce(existingMockDoc); // Direct return for findOne without .lean()

    // Mock the save method of the existing document
    existingMockDoc.save.mockResolvedValueOnce({
      ...existingMockDoc,
      content: 'Updated Memo',
    });

    const result = await service.createMemo(userId, dto);
    expect(result.content).toEqual('Updated Memo');
    expect(existingMockDoc.save).toHaveBeenCalled();
  });

  it('should get a memo by date', async () => {
    const userId = new Types.ObjectId();
    const date = new Date('2025-07-06');
    (memoModel.findOne as jest.Mock).mockImplementationOnce(() =>
      createChainableMock(mockMemoData),
    );

    const result = await service.getMemoByDate(userId, date);
    expect(result).toEqual(mockMemoData);
    expect(memoModel.findOne).toHaveBeenCalledWith({
      userId,
      scheduledDate: {
        $gte: new Date('2025-07-06T00:00:00.000Z'),
        $lte: new Date('2025-07-06T23:59:59.999Z'),
      },
    });
    expect(memoModel.findOne().lean).toHaveBeenCalled();
  });

  it('should update a memo', async () => {
    const userId = new Types.ObjectId();
    const memoId = mockMemoData._id.toHexString();
    const dto = { content: 'Updated Content' };
    (memoModel.findOneAndUpdate as jest.Mock).mockImplementationOnce(() =>
      createChainableMock({
        ...mockMemoData,
        content: 'Updated Content',
      }),
    );

    const result = await service.updateMemo(userId, memoId, dto);
    expect(result.content).toEqual('Updated Content');
    expect(memoModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: memoId, userId },
      { $set: { content: 'Updated Content' } },
      { new: true },
    );
    expect(memoModel.findOneAndUpdate().lean).toHaveBeenCalled();
  });

  it('should delete a memo', async () => {
    const userId = new Types.ObjectId();
    const memoId = mockMemoData._id.toHexString();
    (memoModel.deleteOne as jest.Mock).mockImplementationOnce(() =>
      createChainableMock({ acknowledged: true, deletedCount: 1 }),
    );

    await expect(service.deleteMemo(userId, memoId)).resolves.toBeUndefined();
    expect(memoModel.deleteOne).toHaveBeenCalledWith({ _id: memoId, userId });
    expect(memoModel.deleteOne().exec).toHaveBeenCalled();
  });

  it('should throw NotFoundException if memo not found for update', async () => {
    const userId = new Types.ObjectId();
    const memoId = new Types.ObjectId().toHexString();
    const dto = { content: 'Updated Content' };
    (memoModel.findOneAndUpdate as jest.Mock).mockImplementationOnce(() =>
      createChainableMock(null),
    );

    await expect(service.updateMemo(userId, memoId, dto)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw NotFoundException if memo not found for delete', async () => {
    const userId = new Types.ObjectId();
    const memoId = new Types.ObjectId().toHexString();
    (memoModel.deleteOne as jest.Mock).mockImplementationOnce(() =>
      createChainableMock({ acknowledged: true, deletedCount: 0 }),
    );

    await expect(service.deleteMemo(userId, memoId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should get all memos', async () => {
    const userId = new Types.ObjectId();
    const filterDto = {};
    (memoModel.find as jest.Mock).mockImplementationOnce(() =>
      createChainableMock([mockMemoData]),
    );

    const result = await service.getAllMemos(userId, filterDto);
    expect(result).toEqual([mockMemoData]);
    expect(memoModel.find).toHaveBeenCalledWith({ userId });
    expect(memoModel.find().lean).toHaveBeenCalled();
  });

  it('should get all memos with date filter', async () => {
    const userId = new Types.ObjectId();
    const filterDto = { scheduledDate: '2025-07-06' };
    (memoModel.find as jest.Mock).mockImplementationOnce(() =>
      createChainableMock([mockMemoData]),
    );

    const result = await service.getAllMemos(userId, filterDto);
    expect(result).toEqual([mockMemoData]);
    expect(memoModel.find).toHaveBeenCalledWith({
      userId,
      scheduledDate: {
        $gte: new Date('2025-07-06T00:00:00.000Z'),
        $lte: new Date('2025-07-06T23:59:59.999Z'),
      },
    });
    expect(memoModel.find().lean).toHaveBeenCalled();
  });
});
