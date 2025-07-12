import {
  BadRequestException,
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { TodoService } from './todo.service';
import {
  CreateTodoDto,
  GetTodosFilterDto,
  UpdateTodoDto,
  UpdateTodoCompletionDto,
} from './dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/user/decorator/user.decorator';
import { Types } from 'mongoose';

@ApiTags('Todo')
@UseGuards(AuthGuard('jwt'))
@ApiCookieAuth('accessToken')
@Controller('todo')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @ApiOperation({ summary: 'Todo 생성' })
  @ApiBody({ type: CreateTodoDto })
  @Post()
  async create(
    @CurrentUser() user: { _id: string },
    @Body() dto: CreateTodoDto,
  ) {
    const userId = user._id;
    return this.todoService.create(userId, dto);
  }

  @ApiOperation({ summary: 'Todo 목록 조회 (필터링 및 검색)' })
  @ApiQuery({
    name: 'date',
    type: String,
    required: false,
    description: '특정 날짜의 Todo 조회 (YYYY-MM-DD)',
    example: '2025-06-27',
  })
  @ApiQuery({
    name: 'isCompleted',
    type: Boolean,
    required: false,
    description: '완료 여부로 필터링',
    example: true,
  })
  @ApiQuery({
    name: 'search',
    type: String,
    required: false,
    description: '제목 또는 설명으로 검색',
    example: '운동',
  })
  @Get()
  async findAll(
    @CurrentUser() user: { _id: string },
    @Query() filterDto: GetTodosFilterDto,
  ) {
    return this.todoService.findAll(user._id, filterDto);
  }

  @ApiOperation({ summary: '특정 날짜의 Todo 조회' })
  @ApiQuery({ name: 'date', required: true, example: '2025-06-27' })
  @Get('date')
  async findByDate(
    @CurrentUser() user: { _id: string },
    @Query('date') date: string,
  ) {
    return this.todoService.findDate(user._id, new Date(date));
  }

  @Get('week')
  @ApiOperation({
    summary: '지정한 주간의 TODO 리스트 전체 조회 (일요일~토요일)',
  })
  @ApiQuery({
    name: 'sunday',
    required: true,
    description: '해당 주의 시작일 (일요일), 형식: YYYY-MM-DD',
    example: '2025-06-29',
  })
  async getWeekTodos(
    @CurrentUser() user: { _id: string },
    @Query('sunday') sundayStr: string,
  ) {
    const sundayDate = new Date(sundayStr);

    if (isNaN(sundayDate.getTime())) {
      throw new BadRequestException(
        '유효한 날짜 형식이 아닙니다. YYYY-MM-DD로 입력해주세요.',
      );
    }

    return this.todoService.findWeekRangeFromSunday(user._id, sundayDate);
  }

  @Get('exists')
  @ApiQuery({
    name: 'date',
    required: true,
    example: '2025-06-27',
    description: '확인할 날짜 (YYYY-MM-DD)',
  })
  @ApiOperation({ summary: '해당 날짜에 투두가 이미 존재하는지 여부' })
  async exists(
    @CurrentUser() user: { _id: string },
    @Query('date') date: string,
  ) {
    const exists = await this.todoService.hasEntryForDate(
      user._id,
      new Date(date),
    );
    return { exists };
  }
  @Get('month')
  @ApiOperation({ summary: '특정 월의 TODO 리스트 조회 (1일 ~ 말일)' })
  @ApiQuery({
    name: 'year',
    required: true,
    example: 2025,
    description: '조회할 연도',
  })
  @ApiQuery({
    name: 'month',
    required: true,
    example: 6,
    description: '조회할 월 (1-12)',
  })
  async getMonthTodos(
    @CurrentUser() user: { _id: string },
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ) {
    return this.todoService.findMonth(user._id, month, year);
  }

  @ApiOperation({ summary: '특정 Todo 조회' })
  @Get(':id')
  async findOne(@CurrentUser() user: { _id: string }, @Param('id') id: string) {
    return this.todoService.findOne(user._id, id);
  }

  @ApiOperation({ summary: '특정 Todo 업데이트' })
  @Patch(':id')
  async update(
    @CurrentUser() user: { _id: string },
    @Param('id') id: string,
    @Body() updateTodoDto: UpdateTodoDto,
  ) {
    return this.todoService.update(user._id, id, updateTodoDto);
  }

  @ApiOperation({ summary: '특정 Todo 완료 상태 토글' })
  @Patch(':id/complete')
  async toggleComplete(
    @CurrentUser() user: { _id: string },
    @Param('id') id: string,
    @Body() updateTodoCompletionDto: UpdateTodoCompletionDto,
  ) {
    return this.todoService.toggleTodoCompletion(
      user._id,
      id,
      updateTodoCompletionDto.isCompleted,
    );
  }

  @ApiOperation({ summary: '특정 Todo 삭제' })
  @Delete(':id')
  async remove(@CurrentUser() user: { _id: string }, @Param('id') id: string) {
    return this.todoService.remove(user._id, id);
  }
}
