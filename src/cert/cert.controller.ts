import { Controller, Get, Param, Query } from '@nestjs/common';
import { CertService } from './cert.service';
import { ApiOperation, ApiQuery, ApiTags, ApiParam } from '@nestjs/swagger';

@ApiTags('자격증') // 그룹 이름
@Controller('cert')
export class CertController {
  constructor(private readonly certService: CertService) {}

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
    name: 'seriesnm',
    required: false,
    description: '시리즈명 (기술사 등)',
  })
  @ApiQuery({ name: 'obligfldnm', required: false, description: '대분류명' })
  @ApiQuery({ name: 'mdobligfldnm', required: false, description: '중분류명' })
  async searchCerts(
    @Query('keyword') keyword?: string,
    @Query('agency') agency?: string,
    @Query('seriesnm') seriesnm?: string,
    @Query('obligfldnm') obligfldnm?: string,
    @Query('mdobligfldnm') mdobligfldnm?: string,
  ) {
    return this.certService.searchCerts({
      keyword,
      agency,
      seriesnm,
      obligfldnm,
      mdobligfldnm,
    });
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

  @Get('search/keyword')
  @ApiOperation({
    summary: '자격증 검색',
    description: '검색어로 자격증을 찾습니다.',
  })
  @ApiQuery({ name: 'q', required: true, description: '검색 키워드' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '최대 결과 개수',
    example: 10,
  })
  async getSearchCertByJmnm(
    @Query('q') keyword: string,
    @Query('limit') limit = 10,
  ) {
    if (!keyword) {
      return { message: '검색어가 필요합니다.' };
    }
    return this.certService.getSearchCertByJmnm(keyword, +limit);
  }
}
