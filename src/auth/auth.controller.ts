import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CookieOptions, Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { CurrentUser } from 'src/user/decorator/user.decorator';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { JoinUserRequest } from 'src/user/dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  @Get('kakao-callback')
  @UseGuards(AuthGuard('kakao'))
  @ApiOperation({
    summary: '카카오 로그인 콜백',
    description:
      '카카오 로그인 성공 시 신규 유저는 온보딩 페이지로, 기존 유저는 쿠키 설정 후 홈으로 리다이렉트',
  })
  kakaoCallback(@Req() req: Request, @Res() res: Response) {
    const clientURL =
      this.configService.get<string>('CLIENT_URL') || 'http://localhost:5173';
    const user = req.user as {
      isNewUser: boolean;
      kakaoId: string;
      email: string;
      displayName: string;
      _id: Types.ObjectId;
    };

    if (user.isNewUser) {
      const onboardingURL = `${clientURL}/onboarding-1?kakaoId=${user.kakaoId}&email=${user.email}&displayName=${encodeURIComponent(user.displayName)}`;

      return res.redirect(onboardingURL);
    } else if (user) {
      const { accessToken, refreshToken } = this.authService.getJWT(
        user._id.toString(),
      );
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });

      console.log(
        accessToken,
        refreshToken,
        process.env.NODE_ENV === 'production',
      );
      return res.redirect(`${clientURL}/?isAuth=true`);
    }

    return res.redirect(clientURL);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiCookieAuth('accessToken')
  @ApiOperation({
    summary: '내 정보 조회',
    description:
      '쿠키에 저장된 accessToken을 이용해 현재 로그인된 유저 정보를 조회',
  })
  getMe(@CurrentUser() user: { _id: Types.ObjectId }) {
    return user;
  }

  @Post('refresh-token')
  @ApiCookieAuth('refreshToken')
  @ApiOperation({
    summary: 'accessToken 재발급',
    description:
      '쿠키에 저장된 refreshToken을 이용해 새로운 accessToken을 발급받음',
  })
  async refreshAccessToken(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('리프레시 토큰 없음');
    }

    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const userId = payload.sub;

      const user = await this.userService.findById(userId);
      if (!user) {
        throw new UnauthorizedException('유저 없음');
      }

      const { accessToken } = this.authService.getJWT(user._id.toString());

      const cookieOptions: CookieOptions = {
        sameSite: 'lax',
        secure: false,
        httpOnly: true,
      };

      res.cookie('accessToken', accessToken, cookieOptions);
      console.log('새 accessToken 발급:', accessToken);
      return res.status(200).send({ message: 'accessToken 재발급 완료' });
    } catch (error) {
      console.error('refreshToken 검증 실패:', error);
      throw new UnauthorizedException('리프레시 토큰 검증 실패');
    }
  }

  @Post('join')
  @ApiOperation({
    summary: '카카오 로그인 온보딩 후 회원가입',
    description: '온보딩 완료 후 추가 정보를 받아 최종적으로 회원가입 처리',
  })
  async kakaoSignup(
    @Body()
    body: { user: JoinUserRequest },
    @Res() res: Response,
  ) {
    const user = await this.authService.join(body.user);

    const { accessToken, refreshToken } = this.authService.getJWT(
      user._id!.toString(),
    );
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return {
      message: '회원가입 완료',
      user,
    };
  }

  @Delete('logout')
  @ApiOperation({
    summary: '로그아웃',
    description: '쿠키에서 accessToken, refreshToken 제거 후 로그아웃 처리',
  })
  async logout(@Res() res: Response) {
    const cookieOptions: CookieOptions = {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    };

    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);

    await this.authService.logout();
    return res.status(200).send({ message: '로그아웃 완료' });
  }
}
