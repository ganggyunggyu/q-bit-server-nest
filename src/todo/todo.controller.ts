import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { TodoService } from './todo.service';
import { CreateTodoDto } from './dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/user/decorator/user.decorator';

@ApiTags('Todo')
@UseGuards(AuthGuard('jwt'))
@ApiCookieAuth('accessToken')
@Controller('todo')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @ApiOperation({ summary: 'Todo + Memo 생성' })
  @ApiBody({ type: CreateTodoDto })
  @Post()
  async create(@CurrentUser() user, @Body() dto: CreateTodoDto) {
    const userId = user._id;
    return this.todoService.create(userId, dto);
  }

  @ApiOperation({ summary: '전체 Todo + Memo 목록 조회 (날짜별 그룹)' })
  @Get('all')
  async findAll(@CurrentUser() user) {
    return this.todoService.findAll(user._id);
  }

  @ApiOperation({ summary: '특정 날짜의 Todo + Memo 조회' })
  @ApiQuery({ name: 'date', required: true, example: '2025-06-27' })
  @Get('date')
  async findByDate(@CurrentUser() user, @Query('date') date: string) {
    return this.todoService.findDate(user._id, new Date(date));
  }

  @Get('exists')
  @ApiQuery({ name: 'date', required: true, example: '2025-06-27' })
  @ApiOperation({ summary: '해당 날짜에 투두/메모가 이미 존재하는지 여부' })
  async exists(@CurrentUser() user, @Query('date') date: string) {
    const exists = await this.todoService.hasEntryForDate(
      user._id,
      new Date(date),
    );
    return { exists };
  }
}
