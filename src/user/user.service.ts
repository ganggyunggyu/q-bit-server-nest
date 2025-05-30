import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schema/user.schema';
import { newUser } from 'src/strategy/kakao.strategy';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async findByKakaoId(kakaoId: string) {
    return this.userModel.findOne({ kakaoId }).exec();
  }

  async createKakaoUser(user: newUser) {
    console.log(user);
    const createdUser = new this.userModel(user);
    return createdUser.save();
  }

  async findById(userId: string) {
    return this.userModel.findById(userId).exec();
  }
}
