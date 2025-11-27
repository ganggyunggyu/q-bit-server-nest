import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/schema/user.schema';
import { JoinUserRequest } from 'src/user/dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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
    const secret = this.configService.get<string>('JWT_SECRET');

    const accessToken = this.jwtService.sign(payload, {
      secret,
      expiresIn: '1h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret,
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  async join(user: JoinUserRequest): Promise<UserDocument> {
    return this.userModel.create(user);
  }
  logout(): { message: string } {
    return { message: '로그아웃 완료' };
  }
}
