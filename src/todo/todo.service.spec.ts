import { Test, TestingModule } from '@nestjs/testing';
import { TodoService } from './todo.service';
import { getModelToken } from '@nestjs/mongoose';
import { Todo } from './schema/todo.schema';
import { Model } from 'mongoose';

describe('TodoService', () => {
  let service: TodoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodoService,
        {
          provide: getModelToken(Todo.name),
          useValue: {
            // Mock your model methods here
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            findOneAndUpdate: jest.fn(),
            deleteOne: jest.fn(),
            countDocuments: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TodoService>(TodoService);
    module.get<Model<Todo>>(getModelToken(Todo.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
