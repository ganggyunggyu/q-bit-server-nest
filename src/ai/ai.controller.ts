import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  RecommendRequestDto,
  RecommendResponseDto,
  WeeklyReportRequestDto,
  WeeklyReportResponseDto,
} from './dto';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate')
  @ApiOperation({
    summary: 'Grok AI 텍스트 생성',
    description: '프롬프트를 받아 Grok 모델로 텍스트를 생성합니다.',
  })
  async generate(
    @Body() body: { prompt: string; systemMessage?: string },
  ): Promise<{ text: string }> {
    const text = await this.aiService.generateText(
      body.prompt,
      body.systemMessage,
    );
    return { text };
  }

  @Post('chat')
  @ApiOperation({
    summary: 'Grok AI 채팅',
    description: '대화 컨텍스트를 유지하며 Grok과 채팅합니다.',
  })
  async chat(
    @Body()
    body: { messages: { role: 'user' | 'assistant'; content: string }[] },
  ): Promise<{ text: string }> {
    const text = await this.aiService.chat(body.messages);
    return { text };
  }

  @Post('recommend')
  @ApiOperation({
    summary: 'AI 자격증 추천',
    description: '사용자 정보를 바탕으로 AI가 적합한 자격증을 추천합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '추천 성공',
    type: RecommendResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청',
  })
  @ApiResponse({
    status: 500,
    description: 'AI 서비스 오류',
  })
  async recommend(
    @Body() dto: RecommendRequestDto,
  ): Promise<RecommendResponseDto> {
    return this.aiService.recommendCertifications(dto);
  }

  @Post('weekly-report')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'AI 주간 리포트',
    description:
      '사용자의 주간 투두를 분석하여 AI가 리포트를 생성합니다. 인증 필요.',
  })
  @ApiResponse({
    status: 200,
    description: '리포트 생성 성공',
    type: WeeklyReportResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증 필요',
  })
  async weeklyReport(
    @Req() req: Request,
    @Body() dto: WeeklyReportRequestDto,
  ): Promise<WeeklyReportResponseDto> {
    const userId = (req.user as any)._id;
    return this.aiService.generateWeeklyReport(
      userId,
      dto.sundayDate,
      dto.refresh ?? false,
    );
  }
}
