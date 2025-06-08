import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cert, CertDocument } from './schema/cert.schema';

@Injectable()
export class CertService {
  constructor(@InjectModel(Cert.name) private certModel: Model<CertDocument>) {}

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
    console.log(id);
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
}
