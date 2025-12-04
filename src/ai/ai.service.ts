import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { createXai } from '@ai-sdk/xai';
import { generateText } from 'ai';
import { Model, Types } from 'mongoose';
import { CertService } from '../cert/cert.service';
import { TodoService } from '../todo/todo.service';
import { WeeklyReport, WeeklyReportDocument } from './schema';
import {
  RecommendRequestDto,
  RecommendResponseDto,
  CertRecommendation,
  WeeklyReportResponseDto,
  DailyStats,
} from './dto';

@Injectable()
export class AiService {
  constructor(
    private readonly configService: ConfigService,
    private readonly certService: CertService,
    private readonly todoService: TodoService,
    @InjectModel(WeeklyReport.name)
    private readonly weeklyReportModel: Model<WeeklyReportDocument>,
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

  async generateWeeklyReport(
    userId: Types.ObjectId,
    sundayDate?: string,
    refresh = false,
  ): Promise<WeeklyReportResponseDto> {
    const sunday = sundayDate ? new Date(sundayDate) : this.getThisSunday();
    const weekStart = sunday.toISOString().split('T')[0];

    if (!refresh) {
      const existingReport = await this.weeklyReportModel
        .findOne({ userId, weekStart })
        .lean();

      if (existingReport) {
        return {
          weekStart: existingReport.weekStart,
          weekEnd: existingReport.weekEnd,
          totalTodos: existingReport.totalTodos,
          completedTodos: existingReport.completedTodos,
          weeklyCompletionRate: existingReport.weeklyCompletionRate,
          dailyStats: existingReport.dailyStats,
          summary: existingReport.summary,
          achievements: existingReport.achievements,
          improvements: existingReport.improvements,
          nextWeekSuggestions: existingReport.nextWeekSuggestions,
          encouragement: existingReport.encouragement,
        };
      }
    }

    const weekData = await this.todoService.findWeekRangeFromSunday(
      userId as any,
      sunday,
    );

    const dailyStats: DailyStats[] = weekData.map((day) => {
      const total = day.todos.length;
      const completed = day.todos.filter((t: any) => t.isCompleted).length;
      return {
        date: day.scheduledDateStr,
        total,
        completed,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });

    const totalTodos = dailyStats.reduce((sum, d) => sum + d.total, 0);
    const completedTodos = dailyStats.reduce((sum, d) => sum + d.completed, 0);
    const weeklyCompletionRate =
      totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

    const weekEnd = weekData[6].scheduledDateStr;

    if (totalTodos === 0) {
      return {
        weekStart,
        weekEnd,
        totalTodos: 0,
        completedTodos: 0,
        weeklyCompletionRate: 0,
        dailyStats,
        summary: '이번 주에는 등록된 할 일이 없습니다.',
        achievements: [],
        improvements: ['할 일을 등록해서 학습 계획을 세워보세요!'],
        nextWeekSuggestions: ['목표 자격증을 설정하고 학습 계획을 시작해보세요.'],
        encouragement: '새로운 시작을 응원합니다! 화이팅!',
      };
    }

    const todoDetails = weekData
      .filter((d) => d.todos.length > 0)
      .map((d) => {
        const todos = d.todos
          .map(
            (t: any) =>
              `  - ${t.isCompleted ? '✅' : '❌'} ${t.title}${t.description ? ` (${t.description})` : ''}`,
          )
          .join('\n');
        return `${d.scheduledDateStr}:\n${todos}`;
      })
      .join('\n\n');

    const prompt = `
다음은 사용자의 이번 주(${weekStart} ~ ${weekEnd}) 할 일 목록입니다:

${todoDetails}

통계:
- 전체 할 일: ${totalTodos}개
- 완료: ${completedTodos}개
- 완료율: ${weeklyCompletionRate}%

위 정보를 바탕으로 주간 리포트를 작성해주세요.

응답은 반드시 아래 JSON 형식으로만 작성해주세요:

{
  "summary": "이번 주 활동 요약 (3-4문장, 자격증 공부나 학습 관점에서)",
  "achievements": ["잘한 점 1", "잘한 점 2", "잘한 점 3"],
  "improvements": ["개선할 점 1", "개선할 점 2"],
  "nextWeekSuggestions": ["다음 주 추천 활동 1", "다음 주 추천 활동 2", "다음 주 추천 활동 3"],
  "encouragement": "격려 메시지 (1-2문장, 따뜻하고 동기부여가 되는)"
}

중요:
- 자격증 공부, 시험 준비 관점에서 분석해주세요
- 완료율이 낮아도 긍정적인 피드백을 포함해주세요
- 구체적이고 실천 가능한 제안을 해주세요
- JSON 형식만 반환하고, 다른 텍스트는 포함하지 마세요
    `.trim();

    const aiResponse = await this.callGrokAI(
      prompt,
      'You are a supportive study coach specializing in Korean certification exams. Provide encouraging and constructive weekly reviews in Korean. Always respond in valid JSON format only.',
    );

    try {
      const cleanedText = aiResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanedText);

      const report: WeeklyReportResponseDto = {
        weekStart,
        weekEnd,
        totalTodos,
        completedTodos,
        weeklyCompletionRate,
        dailyStats,
        summary: parsed.summary || '주간 리포트가 생성되었습니다.',
        achievements: parsed.achievements || [],
        improvements: parsed.improvements || [],
        nextWeekSuggestions: parsed.nextWeekSuggestions || [],
        encouragement: parsed.encouragement || '이번 주도 수고하셨습니다!',
      };

      await this.saveWeeklyReport(userId, report);
      return report;
    } catch (error) {
      const report: WeeklyReportResponseDto = {
        weekStart,
        weekEnd,
        totalTodos,
        completedTodos,
        weeklyCompletionRate,
        dailyStats,
        summary: `이번 주 ${totalTodos}개의 할 일 중 ${completedTodos}개를 완료했습니다.`,
        achievements:
          completedTodos > 0 ? ['목표를 향해 꾸준히 노력하고 있습니다.'] : [],
        improvements: ['계획한 일을 조금씩 실천해보세요.'],
        nextWeekSuggestions: ['작은 목표부터 시작해보세요.'],
        encouragement: '꾸준함이 실력이 됩니다. 화이팅!',
      };

      await this.saveWeeklyReport(userId, report);
      return report;
    }
  }

  private async saveWeeklyReport(
    userId: Types.ObjectId,
    report: WeeklyReportResponseDto,
  ) {
    await this.weeklyReportModel.findOneAndUpdate(
      { userId, weekStart: report.weekStart },
      { userId, ...report },
      { upsert: true, new: true },
    );
  }

  private getThisSunday(): Date {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day;
    return new Date(now.setDate(diff));
  }
}
