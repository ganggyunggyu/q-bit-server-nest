import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createXai } from '@ai-sdk/xai';
import { generateText } from 'ai';
import { CertService } from '../cert/cert.service';
import {
  RecommendRequestDto,
  RecommendResponseDto,
  CertRecommendation,
} from './dto';

@Injectable()
export class AiService {
  constructor(
    private readonly configService: ConfigService,
    private readonly certService: CertService
  ) {}

  private getXaiProvider() {
    const apiKey = this.configService.get<string>('XAI_API_KEY');

    if (!apiKey) {
      throw new Error('XAI_API_KEY가 설정되지 않았습니다.');
    }

    return createXai({ apiKey });
  }

  private async callGrokAI(prompt: string, systemMessage: string) {
    const xai = this.getXaiProvider();

    const result = await generateText({
      model: xai('grok-4'),
      system: systemMessage,
      prompt,
    });

    return result.text;
  }

  async generateText(prompt: string, systemMessage?: string) {
    return this.callGrokAI(
      prompt,
      systemMessage ||
        'You are Grok, a highly intelligent, helpful AI assistant.'
    );
  }

  async chat(messages: { role: 'user' | 'assistant'; content: string }[]) {
    const lastMessage = messages[messages.length - 1];
    return this.callGrokAI(
      lastMessage.content,
      'You are Grok, a highly intelligent, helpful AI assistant.'
    );
  }

  async recommendCertifications(
    dto: RecommendRequestDto
  ): Promise<RecommendResponseDto> {
    const allCerts = await this.certService.searchCerts({});

    const certsContext = allCerts
      .map(
        (cert: any) =>
          `- ID: ${cert._id}, 이름: ${cert.name}, 등급: ${cert.grade || '정보없음'}, 분야: ${cert.category || '정보없음'}, 기관: ${cert.agency || '정보없음'}`
      )
      .join('\n');

    const userContext = `
사용자 정보:
- 나이: ${dto.age || '정보없음'}
- 학력: ${dto.education || '정보없음'}
- 관심 분야: ${dto.field || '정보없음'}
- 경력: ${dto.experience || '정보없음'}
- 목표: ${dto.goal || '정보없음'}
- 추가 정보: ${dto.additionalInfo || '없음'}
    `.trim();

    const prompt = `
${userContext}

다음은 대한민국의 자격증 목록입니다:
${certsContext}

위 사용자 정보를 바탕으로 가장 적합한 자격증 3-5개를 추천해주세요.

응답은 반드시 아래 JSON 형식으로만 작성해주세요:

{
  "recommendations": [
    {
      "certId": "자격증 ID",
      "name": "자격증 이름",
      "reason": "추천 이유 (2-3문장)",
      "difficulty": "easy 또는 medium 또는 hard",
      "expectedPeriod": "예상 준비 기간 (예: 3-6개월)",
      "matchScore": 0-100 사이 정수
    }
  ],
  "summary": "전체 추천 요약 (3-4문장)",
  "aiMessage": "사용자에게 전하는 격려 메시지 (1-2문장)"
}

중요:
- certId는 반드시 위 자격증 목록의 실제 ID를 사용하세요
- name도 위 목록의 정확한 이름을 사용하세요
- matchScore가 높은 순서로 정렬하세요
- difficulty는 사용자의 학력과 경력을 고려해서 판단하세요
- 사용자의 goal을 최우선으로 고려하세요
- JSON 형식만 반환하고, 다른 텍스트는 포함하지 마세요
    `.trim();

    const aiResponse = await this.callGrokAI(
      prompt,
      'You are an expert career counselor specializing in Korean certifications. You provide personalized certification recommendations based on user profiles. Always respond in valid JSON format only, without any additional text or markdown.'
    );

    try {
      const cleanedText = aiResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanedText);

      return {
        recommendations: parsed.recommendations || [],
        summary: parsed.summary || '추천 결과가 생성되었습니다.',
        aiMessage: parsed.aiMessage,
      };
    } catch (error) {
      throw new Error('AI 응답 파싱 실패: ' + error.message);
    }
  }
}
