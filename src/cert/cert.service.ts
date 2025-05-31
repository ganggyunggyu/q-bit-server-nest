import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cert, CertDocument } from './schema/cert.schema';

@Injectable()
export class CertService {
  constructor(
    @InjectModel(Cert.name) private readonly certModel: Model<CertDocument>,
  ) {}

  async findAll(): Promise<Cert[]> {
    return this.certModel.find().exec();
  }

  async findByJmcd(jmcd: string): Promise<Cert | null> {
    return this.certModel.findOne({ jmcd }).exec();
  }

  async upsertCert(cert: Partial<Cert>): Promise<Cert> {
    return this.certModel
      .findOneAndUpdate(
        { jmcd: cert.jmcd },
        { $set: cert },
        { new: true, upsert: true },
      )
      .exec();
  }
}
