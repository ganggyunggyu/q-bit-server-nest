import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/schema/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async findByKakaoId(kakaoId: string): Promise<User | null> {
    return this.userModel.findOne({ kakaoId }).exec();
  }

  async registerKakaoUser({
    kakaoId,
    email,
    nickname,
    phoneNumber,
  }: {
    kakaoId: string;
    email: string;
    nickname: string;
    phoneNumber?: string;
  }): Promise<User> {
    const existingUser = await this.findByKakaoId(kakaoId);
    if (existingUser) return existingUser;

    return this.userModel.create({
      kakaoId,
      email,
      displayName: nickname,
      phoneNumber,
    });
  }

  getJWT(userId: string) {
    const payload = { sub: userId };
    console.log(process.env.JWT_SECRET);
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '1h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  async join({
    kakaoId,
    displayName,
    phoneNumber,
    addressList,
  }: {
    kakaoId?: string;
    addressList: string[];
    displayName: string;
    phoneNumber?: string;
  }): Promise<User> {
    return this.userModel.create({
      kakaoId,
      addressList,
      displayName,
      phoneNumber,
    });
  }
}
