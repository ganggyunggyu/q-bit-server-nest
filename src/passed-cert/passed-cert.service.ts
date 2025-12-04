import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, UpdateQuery } from 'mongoose';
import { PassedCert, PassedCertDocument } from './schema';
import {
  CreatePassedCertDto,
  UpdatePassedCertDto,
  GetPassedCertsFilterDto,
} from './dto';

@Injectable()
export class PassedCertService {
  constructor(
    @InjectModel(PassedCert.name)
    private readonly passedCertModel: Model<PassedCertDocument>,
  ) {}

  async create(
    userId: string,
    dto: CreatePassedCertDto,
  ): Promise<PassedCert> {
    const { certId, passedDate, score, type, memo } = dto;

    const passedCert = new this.passedCertModel({
      userId,
      certId,
      passedDate: new Date(passedDate),
      score,
      type,
      memo,
    });

    return passedCert.save();
  }

  async findAll(
    userId: string,
    filterDto: GetPassedCertsFilterDto,
  ): Promise<PassedCert[]> {
    const { certId, type } = filterDto;
    const query: FilterQuery<PassedCert> = { userId };

    if (certId) {
      query.certId = certId;
    }

    if (type) {
      query.type = type;
    }

    return this.passedCertModel
      .find(query)
      .populate('certId', 'name jmNm')
      .sort({ passedDate: -1 })
      .lean();
  }

  async findOne(userId: string, id: string): Promise<PassedCert> {
    const passedCert = await this.passedCertModel
      .findOne({ _id: id, userId })
      .populate('certId', 'name jmNm')
      .lean();

    if (!passedCert) {
      throw new NotFoundException(
        `PassedCert with ID ${id} not found for this user.`,
      );
    }

    return passedCert;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdatePassedCertDto,
  ): Promise<PassedCert> {
    const { passedDate, score, type, memo } = dto;
    const update: UpdateQuery<PassedCert> = {};

    if (passedDate !== undefined) update.passedDate = new Date(passedDate);
    if (score !== undefined) update.score = score;
    if (type !== undefined) update.type = type;
    if (memo !== undefined) update.memo = memo;

    const updatedPassedCert = await this.passedCertModel
      .findOneAndUpdate({ _id: id, userId }, { $set: update }, { new: true })
      .populate('certId', 'name jmNm')
      .lean();

    if (!updatedPassedCert) {
      throw new NotFoundException(
        `PassedCert with ID ${id} not found for this user.`,
      );
    }

    return updatedPassedCert;
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.passedCertModel
      .deleteOne({ _id: id, userId })
      .exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException(
        `PassedCert with ID ${id} not found for this user.`,
      );
    }
  }
}
