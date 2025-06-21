import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/schema/user.schema';
import { JoinUserRequest } from 'src/user/dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async findByKakaoId(kakaoId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ kakaoId }).exec();
  }

  async registerKakaoUser(user): Promise<UserDocument> {
    return this.userModel.create({
      ...user,
    });
  }

  getJWT(userId: string) {
    const payload = { sub: userId };
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

  async join(user: JoinUserRequest): Promise<UserDocument> {
    return this.userModel.create(user);
  }
  async logout(): Promise<{ message: string }> {
    return { message: '로그아웃 완료' };
  }
}
