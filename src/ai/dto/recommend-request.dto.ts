import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecommendRequestDto {
  @ApiProperty({
    description: '나이',
    example: 25,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  age?: number;

  @ApiProperty({
    description: '최종 학력',
    example: '대졸',
    required: false,
  })
  @IsOptional()
  @IsString()
  education?: string;

  @ApiProperty({
    description: '관심 분야',
    example: 'IT',
    required: false,
  })
  @IsOptional()
  @IsString()
  field?: string;

  @ApiProperty({
    description: '경력 수준',
    example: '1년 미만',
    required: false,
  })
  @IsOptional()
  @IsString()
  experience?: string;

  @ApiProperty({
    description: '자격증 취득 목표',
    example: '취업 준비',
    required: false,
  })
  @IsOptional()
  @IsString()
  goal?: string;

  @ApiProperty({
    description: '추가 정보',
    example: '프론트엔드 개발자로 취업하고 싶어요',
    required: false,
  })
  @IsOptional()
  @IsString()
  additionalInfo?: string;
}
