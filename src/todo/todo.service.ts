import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Todo, TodoDocument } from './schema';
import { CreateTodoDto, UpdateTodoDto } from './dto';

@Injectable()
export class TodoService {
  constructor(
    @InjectModel(Todo.name) private readonly todoModel: Model<TodoDocument>,
  ) {}

  /**
   * Todo 생성
   */
  async create(userId: Types.ObjectId, dto: CreateTodoDto): Promise<Todo> {
    const newTodo = new this.todoModel({
      userId,
      scheduledDate: dto.scheduledDate,
      content: dto.content,
      isComplete: dto.isComplete ?? false,
    });
    return await newTodo.save();
  }

  /**
   * 내 Todo 전체 가져오기 (optional: 특정 날짜만)
   */
  async findAll(userId: Types.ObjectId, scheduledDate?: Date): Promise<Todo[]> {
    const query: any = { userId };

    if (scheduledDate) {
      // 같은 날짜만 필터: 날짜만 비교 (00:00 ~ 23:59)
      const start = new Date(scheduledDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(scheduledDate);
      end.setHours(23, 59, 59, 999);
      query.scheduledDate = { $gte: start, $lte: end };
    }

    return this.todoModel.find(query).sort({ scheduledDate: 1 }).exec();
  }

  /**
   * Todo 하나 가져오기
   */
  async findOne(userId: Types.ObjectId, id: string): Promise<Todo> {
    const todo = await this.todoModel.findOne({ _id: id, userId }).exec();
    if (!todo) throw new NotFoundException('Todo not found');
    return todo;
  }

  /**
   * Todo 수정
   */
  async update(
    userId: Types.ObjectId,
    id: string,
    dto: UpdateTodoDto,
  ): Promise<Todo> {
    const updated = await this.todoModel
      .findOneAndUpdate({ _id: id, userId }, dto, {
        new: true,
      })
      .exec();
    if (!updated) throw new NotFoundException('Todo not found');
    return updated;
  }

  /**
   * Todo 삭제
   */
  async remove(userId: Types.ObjectId, id: string): Promise<void> {
    const deleted = await this.todoModel
      .findOneAndDelete({ _id: id, userId })
      .exec();
    if (!deleted) throw new NotFoundException('Todo not found');
  }
}
