import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { MemoService } from './memo.service';
import { CreateMemoDto, UpdateMemoDto, GetMemoFilterDto } from './dto/memo.dto';
import { CurrentUser } from 'src/user/decorator/user.decorator';
import { Types } from 'mongoose';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Memo')
@UseGuards(AuthGuard('jwt'))
@ApiCookieAuth('accessToken')
@Controller('memo')
export class MemoController {
  constructor(private readonly memoService: MemoService) {}

  @ApiOperation({ summary: '메모 생성 또는 업데이트' })
  @ApiBody({ type: CreateMemoDto })
  @Post()
  async createOrUpdateMemo(
    @CurrentUser() user: { _id: Types.ObjectId },
    @Body() dto: CreateMemoDto,
  ) {
    return this.memoService.createMemo(user._id, dto);
  }

  @ApiOperation({ summary: '특정 날짜의 메모 조회' })
  @ApiQuery({ name: 'date', required: true, example: '2025-06-27' })
  @Get('date')
  async getMemoByDate(
    @CurrentUser() user: { _id: Types.ObjectId },
    @Query('date') date: string,
  ) {
    return this.memoService.getMemoByDate(user._id, new Date(date));
  }

  @ApiOperation({ summary: '모든 메모 조회 (필터링 가능)' })
  @Get()
  async getAllMemos(
    @CurrentUser() user: { _id: Types.ObjectId },
    @Query() filterDto: GetMemoFilterDto,
  ) {
    return this.memoService.getAllMemos(user._id, filterDto);
  }

  @ApiOperation({ summary: '메모 업데이트' })
  @ApiBody({ type: UpdateMemoDto })
  @Patch(':id')
  async updateMemo(
    @CurrentUser() user: { _id: Types.ObjectId },
    @Param('id') id: string,
    @Body() dto: UpdateMemoDto,
  ) {
    return this.memoService.updateMemo(user._id, id, dto);
  }

  @ApiOperation({ summary: '메모 삭제' })
  @Delete(':id')
  async deleteMemo(
    @CurrentUser() user: { _id: Types.ObjectId },
    @Param('id') id: string,
  ) {
    return this.memoService.deleteMemo(user._id, id);
  }
}
