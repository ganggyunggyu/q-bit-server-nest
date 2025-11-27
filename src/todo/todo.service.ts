import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Todo, TodoDocument } from './schema';
import { Connection, FilterQuery, Model, UpdateQuery } from 'mongoose';
import { CreateTodoDto, GetTodosFilterDto, UpdateTodoDto } from './dto';

@Injectable()
export class TodoService {
  constructor(
    @InjectModel(Todo.name) private readonly todoModel: Model<TodoDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async create(userId: string, dto: CreateTodoDto): Promise<Todo[]> {
    const { date, todos } = dto;
    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      await this.todoModel.deleteMany({ userId, date }, { session });

      const createdTodos = await this.todoModel.insertMany(
        todos.map((t) => ({
          userId,
          date,
          title: t.title,
          description: t.description,
          isCompleted: t.isCompleted ?? false,
        })),
        { session },
      );

      await session.commitTransaction();
      return createdTodos;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      void session.endSession();
    }
  }

  async findAll(userId: string, filterDto: GetTodosFilterDto) {
    const { date, isCompleted, search } = filterDto;
    const query: FilterQuery<Todo> = { userId };

    if (date) {
      const start = new Date(date);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setUTCHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    if (isCompleted !== undefined) {
      query.isCompleted = isCompleted;
    }

    if (search) {
      query.title = { $regex: search, $options: 'i' }; // 대소문자 구분 없이 검색
    }

    const todos = await this.todoModel.find(query).lean();

    const grouped: Record<string, { todos: Todo[] }> = {};

    for (const todo of todos) {
      const key = todo.date.toISOString().split('T')[0];
      grouped[key] = grouped[key] || { todos: [] };
      grouped[key].todos.push(todo);
    }

    return Object.entries(grouped).map(([date, { todos }]) => {
      const [year, month, day] = date.split('-').map(Number);
      const scheduledDate = new Date(Date.UTC(year, month - 1, day));

      return {
        scheduledDate,
        scheduledDateStr: date,
        todos,
      };
    });
  }

  async findOne(userId: string, todoId: string): Promise<Todo> {
    const todo = await this.todoModel.findOne({ _id: todoId, userId }).lean();
    if (!todo) {
      throw new NotFoundException(
        `Todo with ID ${todoId} not found for this user.`,
      );
    }
    return todo;
  }

  async findDate(userId: string, date: Date) {
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

    const todos = await this.todoModel
      .find({
        userId,
        date: { $gte: start, $lte: end },
      })
      .lean();

    return {
      scheduledDate: start.toISOString().split('T')[0],
      todos,
    };
  }

  async findWeekRangeFromSunday(userId: string, sundayDate: Date) {
    const start = new Date(
      Date.UTC(
        sundayDate.getFullYear(),
        sundayDate.getMonth(),
        sundayDate.getDate(),
        0,
        0,
        0,
        0,
      ),
    );

    const end = new Date(
      Date.UTC(
        start.getUTCFullYear(),
        start.getUTCMonth(),
        start.getUTCDate() + 6,
        23,
        59,
        59,
        999,
      ),
    );

    const todos = await this.todoModel
      .find({
        userId,
        date: { $gte: start, $lte: end },
      })
      .lean();

    const grouped: Record<string, { todos: Todo[] }> = {};

    for (const todo of todos) {
      const key = todo.date.toISOString().split('T')[0];
      grouped[key] = grouped[key] || { todos: [] };
      grouped[key].todos.push(todo);
    }

    return Array.from({ length: 7 }).map((_, i) => {
      const current = new Date(
        Date.UTC(
          start.getUTCFullYear(),
          start.getUTCMonth(),
          start.getUTCDate() + i,
        ),
      );
      const key = current.toISOString().split('T')[0];
      const { todos = [] } = grouped[key] || {};

      return {
        scheduledDate: current,
        scheduledDateStr: key,
        todos,
      };
    });
  }

  async findMonth(userId: string, month: number, year: number) {
    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const todos = await this.todoModel
      .find({
        userId,
        date: { $gte: start, $lte: end },
      })
      .lean();

    const grouped: Record<string, { todos: Todo[] }> = {};

    for (const todo of todos) {
      const key = todo.date.toISOString().split('T')[0];
      grouped[key] = grouped[key] || { todos: [] };
      grouped[key].todos.push(todo);
    }

    const daysInMonth = new Date(year, month, 0).getDate(); // 말일 구하기

    return Array.from({ length: daysInMonth }).map((_, i) => {
      const current = new Date(Date.UTC(year, month - 1, i + 1));
      const key = current.toISOString().split('T')[0];
      const { todos = [] } = grouped[key] || {};

      return {
        scheduledDate: current,
        scheduledDateStr: key,
        todos,
      };
    });
  }
  async hasEntryForDate(userId: string, date: Date): Promise<boolean> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const todoCount = await this.todoModel.countDocuments({
      userId,
      date: { $gte: start, $lte: end },
    });

    return todoCount > 0;
  }

  async update(
    userId: string,
    todoId: string,
    updateTodoDto: UpdateTodoDto,
  ): Promise<Todo> {
    const { date, title, description, isCompleted } = updateTodoDto;
    const update: UpdateQuery<Todo> = {};

    if (date !== undefined) update.date = date;
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (isCompleted !== undefined) update.isCompleted = isCompleted;

    const updatedTodo = await this.todoModel
      .findOneAndUpdate(
        { _id: todoId, userId },
        { $set: update },
        { new: true },
      )
      .lean();

    if (!updatedTodo) {
      throw new NotFoundException(
        `Todo with ID ${todoId} not found for this user.`,
      );
    }
    return updatedTodo;
  }

  async remove(userId: string, todoId: string): Promise<void> {
    const result = await this.todoModel
      .deleteOne({ _id: todoId, userId })
      .exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(
        `Todo with ID ${todoId} not found for this user.`,
      );
    }
  }

  async toggleTodoCompletion(
    userId: string,
    todoId: string,
    isCompleted: boolean,
  ): Promise<Todo> {
    const updatedTodo = await this.todoModel
      .findOneAndUpdate(
        { _id: todoId, userId },
        { $set: { isCompleted } },
        { new: true },
      )
      .lean();

    if (!updatedTodo) {
      throw new NotFoundException(
        `Todo with ID ${todoId} not found for this user.`,
      );
    }
    return updatedTodo;
  }
}
