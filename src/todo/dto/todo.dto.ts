import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  ValidateNested,
  IsArray,
  ArrayMinSize,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTodoItemDto {
  @ApiProperty({ description: 'Todo 항목의 제목', example: '운동하기' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'Todo 항목의 상세 설명',
    required: false,
    example: '헬스장 가서 1시간 운동',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Todo 항목의 완료 여부',
    required: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}

export class CreateTodoDto {
  @ApiProperty({
    description: 'Todo가 속한 날짜 (YYYY-MM-DD)',
    example: '2025-07-06',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    type: [CreateTodoItemDto],
    description: 'Todo 항목 리스트',
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateTodoItemDto)
  todos: CreateTodoItemDto[];
}

export class UpdateTodoDto {
  @ApiProperty({
    description: 'Todo가 속한 날짜 (YYYY-MM-DD)',
    required: false,
    example: '2025-07-07',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({
    description: 'Todo 항목의 제목',
    required: false,
    example: '책 읽기',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @ApiProperty({
    description: 'Todo 항목의 상세 설명',
    required: false,
    example: '개발 서적 30분 읽기',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Todo 항목의 완료 여부',
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}

export class UpdateTodoCompletionDto {
  @ApiProperty({ description: 'Todo 항목의 완료 여부', example: true })
  @IsBoolean()
  @IsNotEmpty()
  isCompleted: boolean;
}

export class GetTodosFilterDto {
  @ApiProperty({
    description: '특정 날짜의 Todo 조회 (YYYY-MM-DD)',
    required: false,
    example: '2025-07-06',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({
    description: '완료 여부로 필터링',
    required: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;

  @ApiProperty({
    description: '제목 또는 설명으로 검색',
    required: false,
    example: '운동',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
