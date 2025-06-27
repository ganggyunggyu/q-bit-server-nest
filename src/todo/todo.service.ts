import { Injectable } from '@nestjs/common';
import { Memo, MemoDocument } from '../memo/schema'; // 경로 맞게 수정
import { InjectModel } from '@nestjs/mongoose';
import { Todo, TodoDocument } from './schema';
import { Model } from 'mongoose';
import { CreateTodoDto } from './dto';
import { Types } from 'mongoose';

@Injectable()
export class TodoService {
  constructor(
    @InjectModel(Todo.name) private readonly todoModel: Model<TodoDocument>,
    @InjectModel(Memo.name) private readonly memoModel: Model<MemoDocument>,
  ) {}

  async create(userId: Types.ObjectId, dto: CreateTodoDto): Promise<Todo[]> {
    const { scheduledDate, todos, memo } = dto;
    const createdTodos = await Promise.all(
      todos.map((t) =>
        this.todoModel.create({
          userId,
          scheduledDate,
          content: t.content,
          isComplete: t.isComplete ?? false,
        }),
      ),
    );
    await this.memoModel.create({
      userId,
      scheduledDate,
      content: memo.content,
    });

    return createdTodos;
  }

  async findAll(userId: Types.ObjectId) {
    const todos = await this.todoModel.find({ userId }).lean();
    const memos = await this.memoModel.find({ userId }).lean();

    const grouped: Record<string, { todos: Todo[]; memo: Memo | null }> = {};

    for (const todo of todos) {
      const key = todo.scheduledDate.toISOString().split('T')[0];
      grouped[key] = grouped[key] || { todos: [], memo: null };
      grouped[key].todos.push(todo);
    }

    for (const memo of memos) {
      const key = memo.scheduledDate.toISOString().split('T')[0];
      grouped[key] = grouped[key] || { todos: [], memo: null };
      grouped[key].memo = memo;
    }

    return Object.entries(grouped).map(([date, { todos, memo }]) => ({
      scheduledDate: date,
      todos,
      memo,
    }));
  }

  async findDate(userId: Types.ObjectId, date: Date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const todos = await this.todoModel
      .find({
        userId,
        scheduledDate: { $gte: start, $lte: end },
      })
      .lean();

    const memo = await this.memoModel
      .findOne({
        userId,
        scheduledDate: { $gte: start, $lte: end },
      })
      .lean();

    return {
      scheduledDate: start.toISOString().split('T')[0],
      todos,
      memo,
    };
  }

  async hasEntryForDate(userId: Types.ObjectId, date: Date): Promise<boolean> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const [todoCount, memoCount] = await Promise.all([
      this.todoModel.countDocuments({
        userId,
        scheduledDate: { $gte: start, $lte: end },
      }),
      this.memoModel.countDocuments({
        userId,
        scheduledDate: { $gte: start, $lte: end },
      }),
    ]);

    return todoCount > 0 || memoCount > 0;
  }
}
