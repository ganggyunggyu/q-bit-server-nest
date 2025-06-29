import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
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
  async getWeekTodos(@CurrentUser() user, @Query('sunday') sundayStr: string) {
    const sundayDate = new Date(sundayStr);

    if (isNaN(sundayDate.getTime())) {
      throw new BadRequestException(
        '유효한 날짜 형식이 아닙니다. YYYY-MM-DD로 입력해주세요.',
      );
    }

    return this.todoService.findWeekRangeFromSunday(user._id, sundayDate);
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
