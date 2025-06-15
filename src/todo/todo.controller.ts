import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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

  @ApiOperation({ summary: 'Todo 생성' })
  @Post()
  async create(@CurrentUser() user, @Body() dto: CreateTodoDto) {
    const userId = user._id;

    return this.todoService.create(userId, dto);
  }

  @ApiOperation({
    summary: 'Todo 목록 조회',
    description: '필요하면 ?date=YYYY-MM-DD 쿼리로 특정 날짜만 조회 가능',
  })
  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiCookieAuth('accessToken')
  async findAll(@CurrentUser() user, @Query('date') date?: string) {
    const userId = user._id;

    const scheduledDate = date ? new Date(date) : undefined;

    return this.todoService.findAll(userId, scheduledDate);
  }

  // @ApiOperation({ summary: 'Todo 상세 조회' })
  // @Get(':id')
  // async findOne(@Req() req: Request, @Param('id') id: string) {
  //   const userId = req.user['id'];
  //   return this.todoService.findOne(userId, id);
  // }

  // @ApiOperation({ summary: 'Todo 수정' })
  // @Patch(':id')
  // async update(
  //   @Req() req: Request,
  //   @Param('id') id: string,
  //   @Body() dto: UpdateTodoDto,
  // ) {
  //   const userId = req.user['id'];
  //   return this.todoService.update(userId, id, dto);
  // }

  // @ApiOperation({ summary: 'Todo 삭제' })
  // @≈Delete(':id')
  // async remove(@Req() req: Request, @Param('id') id: string) {
  //   const userId = req.user['id'];
  //   return this.todoService.remove(userId, id);
  // }
}
