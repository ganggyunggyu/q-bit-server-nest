import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsMongoId,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PassedCertType } from '../schema';

export class CreatePassedCertDto {
  @ApiProperty({
    description: '자격증 ID',
    example: '683c20625af8b0548b647eca',
  })
  @IsMongoId()
  @IsNotEmpty()
  certId: string;

  @ApiProperty({
    description: '합격일 (YYYY-MM-DD)',
    example: '2025-06-15',
  })
  @IsDateString()
  @IsNotEmpty()
  passedDate: string;

  @ApiProperty({
    description: '점수 (선택)',
    required: false,
    example: 85,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  score?: number;

  @ApiProperty({
    description: '합격 유형',
    enum: PassedCertType,
    example: 'final',
  })
  @IsEnum(PassedCertType)
  @IsNotEmpty()
  type: PassedCertType;

  @ApiProperty({
    description: '메모 (선택)',
    required: false,
    example: '첫 시도에 합격!',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  memo?: string;
}

export class UpdatePassedCertDto {
  @ApiProperty({
    description: '합격일 (YYYY-MM-DD)',
    required: false,
    example: '2025-06-15',
  })
  @IsOptional()
  @IsDateString()
  passedDate?: string;

  @ApiProperty({
    description: '점수 (선택)',
    required: false,
    example: 90,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  score?: number;

  @ApiProperty({
    description: '합격 유형',
    enum: PassedCertType,
    required: false,
    example: 'practical',
  })
  @IsOptional()
  @IsEnum(PassedCertType)
  type?: PassedCertType;

  @ApiProperty({
    description: '메모 (선택)',
    required: false,
    example: '재시험 합격',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  memo?: string;
}

export class GetPassedCertsFilterDto {
  @ApiProperty({
    description: '자격증 ID로 필터링',
    required: false,
    example: '683c20625af8b0548b647eca',
  })
  @IsOptional()
  @IsMongoId()
  certId?: string;

  @ApiProperty({
    description: '합격 유형으로 필터링',
    enum: PassedCertType,
    required: false,
    example: 'final',
  })
  @IsOptional()
  @IsEnum(PassedCertType)
  type?: PassedCertType;
}
