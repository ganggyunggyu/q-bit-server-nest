import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { newUser } from 'src/strategy/kakao.strategy';
import { User, UserDocument } from './schema/user.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByKakaoId(kakaoId: string): Promise<User | null> {
    return this.userModel.findOne({ kakaoId }).exec();
  }

  async createKakaoUser(user: newUser): Promise<User> {
    console.log(user);
    return this.userModel.create(user);
  }

  async findById(userId: string) {
    const user = await this.userModel.findById(userId).exec();

    if (user) {
      return user;
    }
    // return this.userModel.findById(userId).exec();
  }
}
