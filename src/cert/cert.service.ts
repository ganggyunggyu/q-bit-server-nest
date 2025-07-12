import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cert, CertDocument } from './schema/cert.schema';
import { User, UserDocument } from 'src/user/schema/user.schema';
import { shuffle } from 'es-toolkit';

@Injectable()
export class CertService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Cert.name) private readonly certModel: Model<CertDocument>,
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
                        { $ne: [{ $type: '$$s.docexamdt' }, 'missing'] },
                        {
                          $regexMatch: {
                            input: '$$s.docexamdt',
                            regex: '^[0-9]{8}$',
                          },
                        },
                        {
                          $gte: [
                            {
                              $dateFromString: {
                                dateString: '$$s.docexamdt',
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
                    dateString: '$$futureSchedule.docexamdt',
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
    seriesnm?: string;
    obligfldnm?: string;
    mdobligfldnm?: string;
  }) {
    const query: any = {};
    if (filters.keyword) query.jmfldnm = { $regex: filters.keyword, $options: 'i' };
    if (filters.agency) query.agency = filters.agency;
    if (filters.seriesnm) query.seriesnm = filters.seriesnm;
    if (filters.obligfldnm) query.obligfldnm = filters.obligfldnm;
    if (filters.mdobligfldnm) query.mdobligfldnm = filters.mdobligfldnm;

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

  async getSearchCertByJmnm(keyword: string, limit = 10): Promise<Cert[]> {
    const pipeline = [
      {
        $search: {
          index: 'jmnm_search_index',
          text: { query: keyword, path: { wildcard: '*' } },
        },
      },
      { $limit: limit },
      ...this.daysLeftCalculationPipeline,
    ];
    return this.certModel.aggregate(pipeline).exec();
  }

  async getPopularCerts() {
    const targetIds = [
      '68529189514e0802729cff70', '685208c24e8e01f9f2534f9d',
      '685208c34e8e01f9f2534faa', '685208c34e8e01f9f2534fab',
      '685208be4e8e01f9f2534f4d', '685208ba4e8e01f9f2534f07',
      '685208c54e8e01f9f2534fd6', '685208cd4e8e01f9f2535078',
      '685208bb4e8e01f9f2534f12', '685299ff514e0802729cff73',
    ].map(id => new Types.ObjectId(id));

    const pipeline = [
        { $match: { _id: { $in: targetIds } } },
        ...this.daysLeftCalculationPipeline
    ];

    const certs = await this.certModel.aggregate(pipeline).exec();
    const shuffled = shuffle(certs);
    return shuffled.slice(0, 5);
  }

  async getUpcomingCerts(limit: number = 3): Promise<Cert[]> {
    const now = new Date();
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(now.getDate() + 7);

    const pipeline = [
        { $unwind: '$schedule' },
        { $match: { 'schedule.docexamdt': { $regex: /^[0-9]{8}$/ } } },
        {
            $addFields: {
                scheduleDate: { $dateFromString: { dateString: '$schedule.docexamdt', format: '%Y%m%d' } }
            }
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