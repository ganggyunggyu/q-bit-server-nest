import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CertService } from './cert.service';
import { QnetScheduleService } from './qnet-schedule.service';
import {
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/user/decorator/user.decorator';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { Types } from 'mongoose';

@ApiTags('자격증')
@Controller('cert')
export class CertController {
  constructor(
    private readonly certService: CertService,
    private readonly qnetScheduleService: QnetScheduleService,
  ) {}

  @Get('search')
  @ApiOperation({
    summary: '자격증 검색',
    description: '쿼리 기반 자격증 검색 기능',
  })
  @ApiQuery({
    name: 'keyword',
    required: false,
    description: '자격증명 키워드',
  })
  @ApiQuery({ name: 'agency', required: false, description: '운영기관' })
  @ApiQuery({
    name: 'grade',
    required: false,
    description: '등급 (기술사, 기사, 산업기사, 기능사 등)',
  })
  @ApiQuery({ name: 'category', required: false, description: '대분류' })
  @ApiQuery({ name: 'subCategory', required: false, description: '중분류' })
  async searchCerts(
    @Query('keyword') keyword?: string,
    @Query('agency') agency?: string,
    @Query('grade') grade?: string,
    @Query('category') category?: string,
    @Query('subCategory') subCategory?: string,
  ) {
    return this.certService.searchCerts({
      keyword,
      agency,
      grade,
      category,
      subCategory,
    });
  }

  @Get('search/keyword')
  @ApiOperation({
    summary: '자격증명 검색',
    description: '검색어로 자격증을 찾습니다. (Atlas Search 사용)',
  })
  @ApiQuery({ name: 'q', required: true, description: '검색 키워드' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '최대 결과 개수',
    example: 10,
  })
  async searchCertsByName(
    @Query('q') keyword: string,
    @Query('limit') limit = 10,
  ) {
    if (!keyword) {
      return { message: '검색어가 필요합니다.' };
    }
    return this.certService.searchCertsByName(keyword, +limit);
  }

  @Get('popular')
  @ApiOperation({ summary: '20대 인기 자격증 5개 조회' })
  @ApiResponse({
    status: 200,
    description: '인기 자격증 목록 조회 성공',
    schema: {
      example: [
        { _id: '683c20625af8b0548b647eca', name: '정보처리기사', grade: '기사', hasSchedule: true, daysLeft: 45 },
        { _id: '683c205e5af8b0548b647dfb', name: '전기기사', grade: '기사', hasSchedule: true, daysLeft: 30 },
        { _id: '683c205c5af8b0548b647dab', name: '토목기사', grade: '기사', hasSchedule: false, daysLeft: null },
      ],
    },
  })
  async getPopularCerts() {
    return this.certService.getPopularCerts();
  }

  @Get('upcoming')
  @ApiOperation({
    summary: '시험일정 일주일 미만 3개',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '최대 결과 개수',
    example: 3,
  })
  async getUpcomingCerts(@Query('limit') limit = 3) {
    return this.certService.getUpcomingCerts(+limit);
  }
  @Get('remind/list')
  @ApiOperation({ summary: '내 리마인드 자격증 리스트 조회' })
  @ApiResponse({
    status: 200,
    description: '내가 설정한 자격증 리스트',
    schema: {
      example: [
        {
          _id: '664a84ffb1d6e9b54a7d8a12',
          code: '1320',
          name: '정보처리기사',
          agency: '한국산업인력공단',
          grade: '기사',
          hasSchedule: true,
          daysLeft: 45,
        },
      ],
    },
  })
  @ApiBearerAuth('accessToken')
  @UseGuards(JwtAuthGuard)
  async getMyRemindCerts(@CurrentUser() user: { _id: Types.ObjectId }) {
    return this.certService.getMyRemindCerts(user._id.toString());
  }

  @Get(':id')
  @ApiOperation({
    summary: '자격증 상세 조회',
    description: '자격증 ID로 상세 정보 조회',
  })
  @ApiParam({ name: 'id', description: '자격증 MongoDB ObjectId' })
  async getCertById(@Param('id') id: string) {
    return this.certService.getCertById(id);
  }

  @Post('/remind/:id')
  @ApiOperation({ summary: '리마인드 자격증 추가' })
  @ApiParam({ name: 'id', description: '자격증 ObjectId' })
  @ApiResponse({
    status: 201,
    description: '자격증이 리마인드 리스트에 추가됨',
    schema: {
      example: { message: '추가 완료' },
    },
  })
  @ApiBearerAuth('accessToken')
  @UseGuards(JwtAuthGuard)
  async addRemindCert(
    @CurrentUser() user: { _id: Types.ObjectId },
    @Param('id') id: string,
  ) {
    return this.certService.addRemindCert(user._id.toString(), id);
  }

  @Delete('/remind/:id')
  @ApiOperation({ summary: '리마인드 자격증 제거' })
  @ApiParam({ name: 'id', description: '자격증 ObjectId' })
  @ApiResponse({
    status: 200,
    description: '자격증이 리마인드 리스트에서 제거됨',
    schema: {
      example: { message: '제거 완료' },
    },
  })
  @ApiBearerAuth('accessToken')
  @UseGuards(JwtAuthGuard)
  async removeRemindCert(
    @CurrentUser() user: { _id: Types.ObjectId },
    @Param('id') id: string,
  ) {
    return this.certService.removeRemindCert(user._id.toString(), id);
  }

  @Get('schedule/status')
  @ApiOperation({
    summary: '일정 데이터 현황 조회',
    description: '자격증 일정 데이터 보유 현황을 확인합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '일정 현황 정보',
    schema: {
      example: {
        total: 178,
        withSchedule: 120,
        withoutSchedule: 58,
        percentage: 67,
      },
    },
  })
  async getScheduleStatus() {
    return this.qnetScheduleService.getScheduleStatus();
  }

  @Post('schedule/sync')
  @ApiOperation({
    summary: 'Q-net API 일정 동기화 (관리자)',
    description:
      '한국산업인력공단 API에서 시험 일정을 가져와 DB를 업데이트합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '동기화 결과',
    schema: {
      example: { updated: 150, notFound: 28 },
    },
  })
  async syncSchedules() {
    return this.qnetScheduleService.updateCertSchedules();
  }
}
