import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { KakaoStrategy } from 'src/strategy/kakao.strategy';

import { User, UserSchema } from 'src/user/schema/user.schema';
import { UserModule } from 'src/user/user.module';
import { JwtStrategy } from 'src/strategy/jwt.strategy';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    PassportModule.register({ session: false }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ConfigModule,
    UserModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, KakaoStrategy, JwtStrategy],
})
export class AuthModule {}
