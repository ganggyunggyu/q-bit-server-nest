import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Memo, MemoDocument } from './schema/memo.schema';
import { CreateMemoDto, UpdateMemoDto, GetMemoFilterDto } from './dto/memo.dto';

@Injectable()
export class MemoService {
  constructor(
    @InjectModel(Memo.name) private readonly memoModel: Model<MemoDocument>,
  ) {}

  async createMemo(userId: Types.ObjectId, dto: CreateMemoDto): Promise<Memo> {
    const { scheduledDate, content } = dto;
    const date = new Date(scheduledDate);

    const existingMemo = await this.memoModel.findOne({
      userId,
      scheduledDate: date,
    });

    if (existingMemo) {
      existingMemo.content = content;
      return existingMemo.save();
    } else {
      const newMemo = new this.memoModel({
        userId,
        scheduledDate: date,
        content,
      });
      return newMemo.save();
    }
  }

  async getMemoByDate(
    userId: Types.ObjectId,
    date: Date,
  ): Promise<Memo | null> {
    const start = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );
    const end = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );

    return this.memoModel
      .findOne({
        userId,
        scheduledDate: { $gte: start, $lte: end },
      })
      .lean();
  }

  async updateMemo(
    userId: Types.ObjectId,
    memoId: string,
    dto: UpdateMemoDto,
  ): Promise<Memo> {
    const { scheduledDate, content } = dto;
    const update: { scheduledDate?: Date; content?: string } = {};

    if (scheduledDate !== undefined)
      update.scheduledDate = new Date(scheduledDate);
    if (content !== undefined) update.content = content;

    const updatedMemo = await this.memoModel
      .findOneAndUpdate(
        { _id: memoId, userId },
        { $set: update },
        { new: true },
      )
      .lean();

    if (!updatedMemo) {
      throw new NotFoundException(
        `Memo with ID ${memoId} not found for this user.`,
      );
    }
    return updatedMemo;
  }

  async deleteMemo(userId: Types.ObjectId, memoId: string): Promise<void> {
    const result = await this.memoModel
      .deleteOne({ _id: memoId, userId })
      .exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(
        `Memo with ID ${memoId} not found for this user.`,
      );
    }
  }

  async getAllMemos(
    userId: Types.ObjectId,
    filterDto: GetMemoFilterDto,
  ): Promise<Memo[]> {
    const { scheduledDate } = filterDto;
    const query: {
      userId: Types.ObjectId;
      scheduledDate?: { $gte: Date; $lte: Date };
    } = { userId };

    if (scheduledDate) {
      const date = new Date(scheduledDate);
      const start = new Date(
        Date.UTC(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          date.getUTCDate(),
          0,
          0,
          0,
          0,
        ),
      );
      const end = new Date(
        Date.UTC(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          date.getUTCDate(),
          23,
          59,
          59,
          999,
        ),
      );
      query.scheduledDate = { $gte: start, $lte: end };
    }

    return this.memoModel.find(query).lean();
  }
}
