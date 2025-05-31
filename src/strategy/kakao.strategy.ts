import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-kakao';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';

export type newUser = {
  kakaoId: string;
  email: string;
  displayName: string;
  profileImage: string;
};

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {
    const clientID = 'e629e37471a602332f12883392235cb5';
    const callbackURL = 'http://localhost:5173/auth/kakao-callback';
    // const clientID = configService.get<string>('KAKAO_CLIENT_ID');
    // const callbackURL = configService.get<string>('KAKAO_CALLBACK_URL');

    if (!clientID || !callbackURL) {
      throw new Error('Kakao OAuth 설정이 누락되었습니다.');
    }
    super({
      clientID,
      callbackURL,
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    const scope = this.configService.get<string>('KAKAO_SCOPE');

    console.log(profile);

    const kakaoId = profile.id.toString();
    const email = profile._json.kakao_account?.email || 'temp@temp.com';
    const displayName = profile.displayName;
    const profileImage = profile._json.properties.profile_image;

    let user = await this.userService.findByKakaoId(kakaoId);

    console.log(profile._json.properties.profile_image);

    if (!user) {
      const newUser = {
        kakaoId,
        email,
        displayName,
        profileImage,
      };
      user = await this.userService.createKakaoUser(newUser);
    }

    return user;
  }
}
