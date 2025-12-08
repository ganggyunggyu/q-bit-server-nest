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

    console.log('findWeekRangeFromSunday query:', {
      userId,
      start: start.toISOString(),
      end: end.toISOString(),
    });

    const allTodos = await this.todoModel.find({ userId }).lean();
    console.log('All todos for user:', allTodos.length);
    if (allTodos.length > 0) {
      console.log('Sample todo date:', allTodos[0].date);
    }

    const todos = await this.todoModel
      .find({
        userId,
        date: { $gte: start, $lte: end },
      })
      .lean();
    console.log('Filtered todos:', todos.length);

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

  async findYearly(userId: string, year: number) {
    const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

    const todos = await this.todoModel
      .find({
        userId,
        date: { $gte: start, $lte: end },
      })
      .lean();

    const grouped: Record<
      string,
      { totalCount: number; completedCount: number }
    > = {};

    for (const todo of todos) {
      const key = todo.date.toISOString().split('T')[0];
      if (!grouped[key]) {
        grouped[key] = { totalCount: 0, completedCount: 0 };
      }
      grouped[key].totalCount++;
      if (todo.isCompleted) {
        grouped[key].completedCount++;
      }
    }

    const data = Object.entries(grouped).map(
      ([date, { totalCount, completedCount }]) => ({
        date,
        totalCount,
        completedCount,
        percentage:
          totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      }),
    );

    const totalDays = data.length;
    const totalTodos = data.reduce((sum, d) => sum + d.totalCount, 0);
    const completedTodos = data.reduce((sum, d) => sum + d.completedCount, 0);
    const averageRate =
      totalTodos > 0
        ? Math.round((completedTodos / totalTodos) * 100 * 10) / 10
        : 0;

    return {
      year,
      data,
      stats: {
        totalDays,
        totalTodos,
        completedTodos,
        averageRate,
      },
    };
  }

  async getStreak(userId: string, baseDate?: string) {
    const today = baseDate ? new Date(baseDate) : new Date();
    today.setUTCHours(0, 0, 0, 0);

    const todos = await this.todoModel
      .find({ userId })
      .sort({ date: -1 })
      .lean();

    const activeDates = new Set<string>();
    for (const todo of todos) {
      if (todo.isCompleted) {
        activeDates.add(todo.date.toISOString().split('T')[0]);
      }
    }

    const sortedDates = Array.from(activeDates).sort().reverse();

    if (sortedDates.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
        streakStartDate: null,
      };
    }

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let streakStartDate: string | null = null;
    let lastActiveDate = sortedDates[0];

    const todayStr = today.toISOString().split('T')[0];
    const yesterdayDate = new Date(today);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    const isActiveToday = activeDates.has(todayStr);
    const isActiveYesterday = activeDates.has(yesterdayStr);

    if (isActiveToday || isActiveYesterday) {
      let checkDate = isActiveToday ? new Date(today) : yesterdayDate;

      while (true) {
        const checkStr = checkDate.toISOString().split('T')[0];
        if (activeDates.has(checkStr)) {
          currentStreak++;
          streakStartDate = checkStr;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    const allDates = Array.from(activeDates).sort();
    tempStreak = 1;
    for (let i = 1; i < allDates.length; i++) {
      const prev = new Date(allDates[i - 1]);
      const curr = new Date(allDates[i]);
      const diffDays = Math.round(
        (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    return {
      currentStreak,
      longestStreak,
      lastActiveDate,
      streakStartDate,
    };
  }
}
