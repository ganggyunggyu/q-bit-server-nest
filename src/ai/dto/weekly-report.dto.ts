import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional } from 'class-validator';

export class WeeklyReportRequestDto {
  @ApiPropertyOptional({
    description: '주의 시작일 (일요일). 미입력 시 이번 주',
    example: '2024-12-01',
  })
  @IsOptional()
  @IsDateString()
  sundayDate?: string;

  @ApiPropertyOptional({
    description: '새로 생성 여부. true면 기존 리포트 무시하고 새로 생성',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  refresh?: boolean;
}

export class DailyStats {
  @ApiProperty({ description: '날짜', example: '2024-12-01' })
  date: string;

  @ApiProperty({ description: '전체 투두 수', example: 5 })
  total: number;

  @ApiProperty({ description: '완료된 투두 수', example: 3 })
  completed: number;

  @ApiProperty({ description: '완료율 (%)', example: 60 })
  completionRate: number;
}

export class WeeklyReportResponseDto {
  @ApiProperty({ description: '주간 시작일', example: '2024-12-01' })
  weekStart: string;

  @ApiProperty({ description: '주간 종료일', example: '2024-12-07' })
  weekEnd: string;

  @ApiProperty({ description: '전체 투두 수', example: 20 })
  totalTodos: number;

  @ApiProperty({ description: '완료된 투두 수', example: 15 })
  completedTodos: number;

  @ApiProperty({ description: '주간 완료율 (%)', example: 75 })
  weeklyCompletionRate: number;

  @ApiProperty({ description: '일별 통계', type: [DailyStats] })
  dailyStats: DailyStats[];

  @ApiProperty({ description: 'AI 주간 요약', example: '이번 주는 자격증 공부에 집중한 한 주였습니다...' })
  summary: string;

  @ApiProperty({ description: '잘한 점', type: [String] })
  achievements: string[];

  @ApiProperty({ description: '개선할 점', type: [String] })
  improvements: string[];

  @ApiProperty({ description: '다음 주 추천', type: [String] })
  nextWeekSuggestions: string[];

  @ApiProperty({ description: '격려 메시지', example: '꾸준히 노력하고 있어요! 화이팅!' })
  encouragement: string;
}
