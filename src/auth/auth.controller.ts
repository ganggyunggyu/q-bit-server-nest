import {
  Controller,
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
      '카카오 로그인 성공 시 accessToken과 refreshToken을 쿠키에 저장하고 클라이언트로 리다이렉트',
  })
  async kakaoCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;

    console.log(req.user);

    const { accessToken, refreshToken } = this.authService.getJWT(user.id);

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

    res.cookie('isLoggedIn', true, {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    const clientURL =
      this.configService.get<string>('CLIENT_URL') || 'http://localhost:5173';

    res.redirect(clientURL);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiCookieAuth('accessToken')
  @ApiOperation({
    summary: '내 정보 조회',
    description:
      '쿠키에 저장된 accessToken을 이용해 현재 로그인된 유저 정보를 조회',
  })
  getMe(@CurrentUser() user) {
    console.log(user);
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

      const { accessToken } = await this.authService.getJWT(
        user.kakaoId as string,
      );

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
}
