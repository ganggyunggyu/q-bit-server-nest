import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-kakao';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';
import { ApiOperation } from '@nestjs/swagger';
import { AuthService } from 'src/auth/auth.service';

export const extractKakaoProfile = (profile: Profile): newUser => {
  const kakaoId = profile.id.toString();
  const email = profile._json.kakao_account?.email || 'temp@temp.com';
  const displayName = profile.displayName;
  const profileImage =
    profile._json.properties?.profile_image ||
    profile._json.kakao_account?.profile?.profile_image_url ||
    '';

  return {
    kakaoId,
    email,
    displayName,
    profileImage,
  };
};

export type newUser = {
  kakaoId: string;
  email: string;
  displayName: string;
  profileImage: string;
  isNewUser?: boolean;
};

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
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
    const userData = extractKakaoProfile(profile);

    const existingUser = await this.userService.findByKakaoId(userData.kakaoId);

    if (existingUser) {
      return existingUser; // 기존 유저는 바로 로그인
    }

    // 신규 유저 → 온보딩 필요
    return {
      ...userData,
      isNewUser: true,
    };
  }
}
