import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PassedCertService } from './passed-cert.service';
import {
  CreatePassedCertDto,
  UpdatePassedCertDto,
  GetPassedCertsFilterDto,
} from './dto';
import { CurrentUser } from 'src/user/decorator/user.decorator';
import { PassedCertType } from './schema';

@ApiTags('PassedCert')
@UseGuards(AuthGuard('jwt'))
@ApiCookieAuth('accessToken')
@Controller('passed-cert')
export class PassedCertController {
  constructor(private readonly passedCertService: PassedCertService) {}

  @ApiOperation({ summary: '합격 기록 등록' })
  @ApiBody({ type: CreatePassedCertDto })
  @Post()
  async create(
    @CurrentUser() user: { _id: string },
    @Body() dto: CreatePassedCertDto,
  ) {
    return this.passedCertService.create(user._id, dto);
  }

  @ApiOperation({ summary: '내 합격 기록 목록 조회' })
  @ApiQuery({
    name: 'certId',
    required: false,
    description: '자격증 ID로 필터링',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: PassedCertType,
    description: '합격 유형으로 필터링',
  })
  @Get()
  async findAll(
    @CurrentUser() user: { _id: string },
    @Query() filterDto: GetPassedCertsFilterDto,
  ) {
    return this.passedCertService.findAll(user._id, filterDto);
  }

  @ApiOperation({ summary: '합격 기록 상세 조회' })
  @ApiParam({ name: 'id', description: '합격 기록 ID' })
  @Get(':id')
  async findOne(
    @CurrentUser() user: { _id: string },
    @Param('id') id: string,
  ) {
    return this.passedCertService.findOne(user._id, id);
  }

  @ApiOperation({ summary: '합격 기록 수정' })
  @ApiParam({ name: 'id', description: '합격 기록 ID' })
  @ApiBody({ type: UpdatePassedCertDto })
  @Patch(':id')
  async update(
    @CurrentUser() user: { _id: string },
    @Param('id') id: string,
    @Body() dto: UpdatePassedCertDto,
  ) {
    return this.passedCertService.update(user._id, id, dto);
  }

  @ApiOperation({ summary: '합격 기록 삭제' })
  @ApiParam({ name: 'id', description: '합격 기록 ID' })
  @Delete(':id')
  async remove(
    @CurrentUser() user: { _id: string },
    @Param('id') id: string,
  ) {
    return this.passedCertService.remove(user._id, id);
  }
}
