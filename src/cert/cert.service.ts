import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cert, CertDocument } from './schema/cert.schema';
import { User, UserDocument } from 'src/user/schema/user.schema';
import mongoose, { Types } from 'mongoose';

@Injectable()
export class CertService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Cert.name) private readonly certModel: Model<CertDocument>,
  ) {}

  async searchCerts(filters: {
    keyword?: string;
    agency?: string;
    seriesnm?: string;
    obligfldnm?: string;
    mdobligfldnm?: string;
  }) {
    const query: any = {};

    if (filters.keyword) {
      query.jmfldnm = { $regex: filters.keyword, $options: 'i' };
    }

    if (filters.agency) query.agency = filters.agency;
    if (filters.seriesnm) query.seriesnm = filters.seriesnm;
    if (filters.obligfldnm) query.obligfldnm = filters.obligfldnm;
    if (filters.mdobligfldnm) query.mdobligfldnm = filters.mdobligfldnm;

    return this.certModel.find(query).exec();
  }

  async getCertById(id: string) {
    return this.certModel.findById(id).exec();
  }

  async getSearchCertByJmnm(keyword: string, limit = 10): Promise<Cert[]> {
    const pipeline = [
      {
        $search: {
          index: 'jmnm_search_index',
          text: {
            query: keyword,
            path: {
              wildcard: '*',
            },
          },
        },
      },
      {
        $limit: limit,
      },
      {
        $project: {
          _id: 1,
          jmfldnm: 1,
        },
      },
    ];

    return this.certModel.aggregate(pipeline).exec();
  }

  async getPopularCerts() {
    const targetIds = [
      '683c20625af8b0548b647eca',
      '683c205e5af8b0548b647dfb',
      '683c205c5af8b0548b647dab',
      '683c205b5af8b0548b647d85',
      '683c205e5af8b0548b647dfc',
    ];

    const certs = await this.certModel.find(
      { _id: { $in: targetIds } },
      { _id: 1, jmfldnm: 1 },
    );

    return certs;
  }

  async getUpcomingCerts(limit: number): Promise<Cert[]> {
    // TODO: 시험 일정 정보가 추가되면 아래 주석 해제하고 정확한 필터링 로직 사용 예정
    // const oneWeekFromNow = new Date();
    // oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

    // return this.certModel.find({
    //   examSchedule: {
    //     $lte: oneWeekFromNow,
    //     $gte: new Date(),
    //   },
    // }).limit(3).exec();

    return this.certModel.aggregate([{ $sample: { size: limit } }]).exec();
  }

  // 🔑 remindCerts 추가
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

  // 🔑 remindCerts 제거
  async removeRemindCert(userId: string, certId: string) {
    await this.userModel.findByIdAndUpdate(
      userId,
      { $pull: { remindCerts: new Types.ObjectId(certId) } },
      { new: true },
    );
    return { message: '제거 완료' };
  }

  // 🔑 현재 내 리스트 조회
  async getMyRemindCerts(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .populate('remindCerts')
      .exec();

    if (!user) throw new NotFoundException('유저 없음');

    return user.remindCerts;
  }
}
