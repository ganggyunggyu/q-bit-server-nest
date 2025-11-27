import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cert, CertDocument, CertSchedule } from './schema/cert.schema';
import { firstValueFrom } from 'rxjs';

interface QnetScheduleItem {
  implSeq: string;
  implYy: string;
  qualgbCd: string;
  qualgbNm: string;
  description: string;
  docRegStartDt: string;
  docRegEndDt: string;
  docExamStartDt: string;
  docExamEndDt: string;
  docPassDt: string;
  pracRegStartDt: string;
  pracRegEndDt: string;
  pracExamStartDt: string;
  pracExamEndDt: string;
  pracPassDt: string;
}

interface QnetApiResponse {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items: QnetScheduleItem[];
      totalCount: number;
    };
  };
}

@Injectable()
export class QnetScheduleService {
  private readonly logger = new Logger(QnetScheduleService.name);
  private readonly baseUrl =
    'http://apis.data.go.kr/B490007/qualExamSchd/getQualExamSchdList';

  constructor(
    private readonly httpService: HttpService,
    @InjectModel(Cert.name) private readonly certModel: Model<CertDocument>,
    private readonly configService: ConfigService,
  ) {}

  async fetchSchedules(year: number = new Date().getFullYear()) {
    const serviceKey = this.configService.get<string>('QNET_API_KEY');

    if (!serviceKey) {
      this.logger.warn('QNET_API_KEY가 설정되지 않았습니다.');
      return null;
    }

    try {
      const url = `${this.baseUrl}?serviceKey=${encodeURIComponent(serviceKey)}&implYy=${year}&dataFormat=json&numOfRows=1000`;

      const response = await firstValueFrom(
        this.httpService.get<QnetApiResponse>(url),
      );

      if (response.data?.response?.header?.resultCode !== '00') {
        this.logger.error(
          `API 에러: ${response.data?.response?.header?.resultMsg}`,
        );
        return null;
      }

      return response.data.response.body.items || [];
    } catch (error) {
      this.logger.error('Q-net API 호출 실패', error);
      return null;
    }
  }

  private mapQnetToCertSchedule(item: QnetScheduleItem): CertSchedule {
    return {
      round: item.implSeq || item.description,
      writtenRegStart: item.docRegStartDt?.replace(/-/g, '') || undefined,
      writtenRegEnd: item.docRegEndDt?.replace(/-/g, '') || undefined,
      writtenExamStart: item.docExamStartDt?.replace(/-/g, '') || undefined,
      writtenExamEnd: item.docExamEndDt?.replace(/-/g, '') || undefined,
      writtenResultDate: item.docPassDt?.replace(/-/g, '') || undefined,
      practicalRegStart: item.pracRegStartDt?.replace(/-/g, '') || undefined,
      practicalRegEnd: item.pracRegEndDt?.replace(/-/g, '') || undefined,
      practicalExamStart: item.pracExamStartDt?.replace(/-/g, '') || undefined,
      practicalExamEnd: item.pracExamEndDt?.replace(/-/g, '') || undefined,
      practicalResultDate: item.pracPassDt?.replace(/-/g, '') || undefined,
    };
  }

  async updateCertSchedules() {
    const currentYear = new Date().getFullYear();
    const items = await this.fetchSchedules(currentYear);

    if (!items || items.length === 0) {
      this.logger.warn('가져온 일정 데이터가 없습니다.');
      return { updated: 0, notFound: 0 };
    }

    let updated = 0;
    let notFound = 0;

    const schedulesByGrade = new Map<string, CertSchedule[]>();

    for (const item of items) {
      const grade = item.qualgbNm;
      if (!schedulesByGrade.has(grade)) {
        schedulesByGrade.set(grade, []);
      }
      schedulesByGrade.get(grade)?.push(this.mapQnetToCertSchedule(item));
    }

    for (const [grade, schedules] of schedulesByGrade.entries()) {
      const result = await this.certModel.updateMany(
        { grade, agency: '한국산업인력공단' },
        { $set: { schedule: schedules } },
      );

      if (result.modifiedCount > 0) {
        updated += result.modifiedCount;
        this.logger.log(`${grade} 일정 업데이트: ${result.modifiedCount}건`);
      } else {
        notFound++;
      }
    }

    this.logger.log(`일정 업데이트 완료: ${updated}건, 미매칭: ${notFound}건`);
    return { updated, notFound };
  }

  async getScheduleStatus() {
    const totalCerts = await this.certModel.countDocuments();
    const certsWithSchedule = await this.certModel.countDocuments({
      schedule: { $exists: true, $ne: [], $type: 'array' },
    });

    return {
      total: totalCerts,
      withSchedule: certsWithSchedule,
      withoutSchedule: totalCerts - certsWithSchedule,
      percentage: Math.round((certsWithSchedule / totalCerts) * 100),
    };
  }
}
