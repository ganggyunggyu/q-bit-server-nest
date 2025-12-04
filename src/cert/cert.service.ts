import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cert, CertDocument } from './schema/cert.schema';
import { User, UserDocument } from 'src/user/schema/user.schema';
import {
  PassedCert,
  PassedCertDocument,
} from 'src/passed-cert/schema/passed-cert.schema';

@Injectable()
export class CertService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Cert.name) private readonly certModel: Model<CertDocument>,
    @InjectModel(PassedCert.name)
    private readonly passedCertModel: Model<PassedCertDocument>,
  ) {}

  private get daysLeftCalculationPipeline() {
    return [
      {
        $addFields: {
          nextExamDate: {
            $min: {
              $map: {
                input: {
                  $filter: {
                    input: { $ifNull: ['$schedule', []] },
                    as: 's',
                    cond: {
                      $and: [
                        { $ne: [{ $type: '$$s.writtenExamStart' }, 'missing'] },
                        {
                          $regexMatch: {
                            input: '$$s.writtenExamStart',
                            regex: '^[0-9]{8}$',
                          },
                        },
                        {
                          $gte: [
                            {
                              $dateFromString: {
                                dateString: '$$s.writtenExamStart',
                                format: '%Y%m%d',
                              },
                            },
                            new Date(),
                          ],
                        },
                      ],
                    },
                  },
                },
                as: 'futureSchedule',
                in: {
                  $dateFromString: {
                    dateString: '$$futureSchedule.writtenExamStart',
                    format: '%Y%m%d',
                  },
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          daysLeft: {
            $cond: {
              if: { $ifNull: ['$nextExamDate', false] },
              then: {
                $dateDiff: {
                  startDate: new Date(),
                  endDate: '$nextExamDate',
                  unit: 'day',
                },
              },
              else: null,
            },
          },
          hasSchedule: {
            $cond: {
              if: {
                $and: [
                  { $isArray: '$schedule' },
                  { $gt: [{ $size: '$schedule' }, 0] },
                ],
              },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          nextExamDate: 0,
        },
      },
    ];
  }

  async searchCerts(filters: {
    keyword?: string;
    agency?: string;
    grade?: string;
    category?: string;
    subCategory?: string;
  }) {
    const query: any = {};
    if (filters.keyword)
      query.name = { $regex: filters.keyword, $options: 'i' };
    if (filters.agency) query.agency = filters.agency;
    if (filters.grade) query.grade = filters.grade;
    if (filters.category) query.category = filters.category;
    if (filters.subCategory) query.subCategory = filters.subCategory;

    const pipeline = [{ $match: query }, ...this.daysLeftCalculationPipeline];
    return this.certModel.aggregate(pipeline).exec();
  }

  async getCertById(id: string) {
    const pipeline = [
      { $match: { _id: new Types.ObjectId(id) } },
      ...this.daysLeftCalculationPipeline,
    ];
    const result = await this.certModel.aggregate(pipeline).exec();
    if (result.length === 0) {
      throw new NotFoundException(`Cert with ID ${id} not found`);
    }
    return result[0];
  }

  async searchCertsByName(keyword: string, limit = 10): Promise<Cert[]> {
    const pipeline = [
      {
        $search: {
          index: 'cert_name_search_index',
          text: { query: keyword, path: { wildcard: '*' } },
        },
      },
      { $limit: limit },
      ...this.daysLeftCalculationPipeline,
    ];
    return this.certModel.aggregate(pipeline).exec();
  }

  async getPopularCerts() {
    // 1. 합격 기록 수 집계
    const passedCounts = await this.passedCertModel.aggregate([
      { $group: { _id: '$certId', passedCount: { $sum: 1 } } },
    ]);
    const passedMap = new Map(
      passedCounts.map((p) => [p._id.toString(), p.passedCount]),
    );

    // 2. 리마인드 수 집계
    const remindCounts = await this.userModel.aggregate([
      { $unwind: '$remindCerts' },
      { $group: { _id: '$remindCerts', remindCount: { $sum: 1 } } },
    ]);
    const remindMap = new Map(
      remindCounts.map((r) => [r._id.toString(), r.remindCount]),
    );

    // 3. 모든 자격증 가져오기 (daysLeft, hasSchedule 포함)
    const allCerts = await this.certModel
      .aggregate(this.daysLeftCalculationPipeline)
      .exec();

    // 4. 인기도 계산 (합격 수 + 리마인드 수)
    const certsWithPopularity = allCerts.map((cert) => {
      const certId = cert._id.toString();
      const passedCount = passedMap.get(certId) || 0;
      const remindCount = remindMap.get(certId) || 0;
      return {
        ...cert,
        popularity: passedCount + remindCount,
        passedCount,
        remindCount,
      };
    });

    // 5. 인기도 순 정렬 후 상위 5개 반환
    return certsWithPopularity
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 5);
  }

  async getUpcomingCerts(limit: number = 3): Promise<Cert[]> {
    const now = new Date();
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(now.getDate() + 7);

    const pipeline = [
      { $unwind: '$schedule' },
      { $match: { 'schedule.writtenExamStart': { $regex: /^[0-9]{8}$/ } } },
      {
        $addFields: {
          scheduleDate: {
            $dateFromString: {
              dateString: '$schedule.writtenExamStart',
              format: '%Y%m%d',
            },
          },
        },
      },
      { $match: { scheduleDate: { $gte: now, $lte: oneWeekFromNow } } },
      ...this.daysLeftCalculationPipeline,
      { $limit: limit },
    ];

    return this.certModel.aggregate(pipeline).exec();
  }

  async addRemindCert(userId: string, certId: string) {
    const cert = await this.certModel.findById(certId);
    if (!cert) throw new NotFoundException('자격증 없음');

    await this.userModel.findByIdAndUpdate(
      userId,
      { $addToSet: { remindCerts: new Types.ObjectId(certId) } },
      { new: true },
    );
    return { message: '추가 완료' };
  }

  async removeRemindCert(userId: string, certId: string) {
    await this.userModel.findByIdAndUpdate(
      userId,
      { $pull: { remindCerts: new Types.ObjectId(certId) } },
      { new: true },
    );
    return { message: '제거 완료' };
  }

  async getMyRemindCerts(userId: string) {
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new NotFoundException('유저 없음');

    const remindCertIds = user.remindCerts || [];
    if (remindCertIds.length === 0) return [];

    const pipeline = [
      { $match: { _id: { $in: remindCertIds } } },
      ...this.daysLeftCalculationPipeline,
    ];

    return this.certModel.aggregate(pipeline).exec();
  }
}
