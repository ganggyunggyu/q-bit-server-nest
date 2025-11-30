import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RecommendRequestDto, RecommendResponseDto } from './dto';

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
}
