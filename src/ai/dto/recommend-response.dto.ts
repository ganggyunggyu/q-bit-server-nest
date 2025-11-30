import { ApiProperty } from '@nestjs/swagger';

export class CertRecommendation {
  @ApiProperty({
    description: '자격증 ID',
    example: '507f1f77bcf86cd799439011',
  })
  certId: string;

  @ApiProperty({
    description: '자격증 이름',
    example: '정보처리기사',
  })
  name: string;

  @ApiProperty({
    description: 'AI 추천 이유',
    example:
      'IT 분야 취업을 준비하시는 분께 가장 기본이 되는 국가기술자격입니다.',
  })
  reason: string;

  @ApiProperty({
    description: '난이도',
    example: 'medium',
    enum: ['easy', 'medium', 'hard'],
  })
  difficulty: string;

  @ApiProperty({
    description: '예상 준비 기간',
    example: '3-6개월',
  })
  expectedPeriod: string;

  @ApiProperty({
    description: '매칭 점수 (0-100)',
    example: 95,
  })
  matchScore: number;
}

export class RecommendResponseDto {
  @ApiProperty({
    description: '추천 자격증 목록',
    type: [CertRecommendation],
  })
  recommendations: CertRecommendation[];

  @ApiProperty({
    description: 'AI의 전체 추천 요약',
    example:
      'IT 분야에서 프론트엔드 개발자로 취업을 목표로 하시는 25세 대졸 경력자분께 총 3개의 자격증을 추천드립니다.',
  })
  summary: string;

  @ApiProperty({
    description: 'AI가 사용자에게 전하는 메시지',
    example: '꾸준히 학습하시면 좋은 결과 있으실 겁니다!',
    required: false,
  })
  aiMessage?: string;
}
