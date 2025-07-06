import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';
import { Types } from 'mongoose';
import { Request, Response } from 'express';

interface MockUser {
  _id?: Types.ObjectId | string;
  isNewUser?: boolean;
  kakaoId?: string;
  email?: string;
  displayName?: string;
}

interface MockRequest extends Request {
  user?: MockUser;
  res?: Response;
  cookies?: { refreshToken?: string };
}

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let jwtService: JwtService;
  let userService: UserService;

  const mockAuthService = {
    getJWT: jest.fn(),
    join: jest.fn(),
    logout: jest.fn(),
  };

  const mockJwtService = {
    verifyAsync: jest.fn(),
    sign: jest.fn(),
  };

  const mockUserService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest() as MockRequest;
          request.user = { _id: new Types.ObjectId() }; // Mock user
          return true;
        },
      })
      .overrideGuard(AuthGuard('kakao'))
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest();
          request.user = {
            isNewUser: false,
            kakaoId: '123',
            email: 'test@test.com',
            displayName: 'Test User',
          };
          request.res = {
            redirect: jest.fn(),
            cookie: jest.fn(),
          } as unknown as Response;
          return true;
        },
      })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('kakaoCallback', () => {
    it('should redirect to onboarding for new user', async () => {
      const req: MockRequest = {
        user: {
          isNewUser: true,
          kakaoId: '123',
          email: 'test@test.com',
          displayName: 'Test User',
        },
      };
      const res: Partial<Response> = { redirect: jest.fn() };

      controller.kakaoCallback(req, res as Response);
      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:5173/onboarding-1?kakaoId=123&email=test@test.com&displayName=Test%20User',
      );
    });

    it('should set cookies and redirect to home for existing user', async () => {
      const req: MockRequest = {
        user: { isNewUser: false, _id: 'someUserId' },
      };
      const res: Partial<Response> = { redirect: jest.fn(), cookie: jest.fn() };
      (authService.getJWT as jest.Mock).mockReturnValue({
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken',
      });

      controller.kakaoCallback(req, res as Response);
      expect(res.cookie).toHaveBeenCalledWith(
        'accessToken',
        'mockAccessToken',
        expect.any(Object),
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'mockRefreshToken',
        expect.any(Object),
      );
      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:5173/?isAuth=true',
      );
    });
  });

  describe('getMe', () => {
    it('should return current user', () => {
      const user: MockUser = {
        _id: new Types.ObjectId(),
        email: 'test@example.com',
      };
      expect(controller.getMe(user)).toEqual(user);
    });
  });

  describe('refreshAccessToken', () => {
    it('should return new accessToken', async () => {
      const req: MockRequest = {
        cookies: { refreshToken: 'validRefreshToken' },
      };
      const res: Response = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        cookie: jest.fn(),
      } as unknown as Response;
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
        sub: 'someUserId',
      });
      (userService.findById as jest.Mock).mockResolvedValue({
        _id: 'someUserId',
      });
      (authService.getJWT as jest.Mock).mockResolvedValue({
        accessToken: 'newAccessToken',
      });

      await controller.refreshAccessToken(req, res);
      expect(res.cookie).toHaveBeenCalledWith(
        'accessToken',
        'newAccessToken',
        expect.any(Object),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        message: 'accessToken 재발급 완료',
      });
    });

    it('should throw UnauthorizedException if refreshToken is missing', async () => {
      const req: MockRequest = { cookies: {} };
      const res: Response = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as unknown as Response;

      await expect(controller.refreshAccessToken(req, res)).rejects.toThrow(
        '리프레시 토큰 없음',
      );
    });

    it('should throw UnauthorizedException if refreshToken is invalid', async () => {
      const req: MockRequest = {
        cookies: { refreshToken: 'invalidRefreshToken' },
      };
      const res: Response = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as unknown as Response;
      (jwtService.verifyAsync as jest.Mock).mockRejectedValue(
        new Error('Invalid token'),
      );

      await expect(controller.refreshAccessToken(req, res)).rejects.toThrow(
        '리프레시 토큰 검증 실패',
      );
    });
  });

  describe('kakaoSignup', () => {
    it('should join user and set cookies', async () => {
      const body = {
        user: {
          kakaoId: '123',
          email: 'new@test.com',
          displayName: 'New User',
        },
      };
      const res: Partial<Response> = { cookie: jest.fn() };
      (authService.join as jest.Mock).mockResolvedValue({ _id: 'newUserId' });
      (authService.getJWT as jest.Mock).mockReturnValue({
        accessToken: 'newAccessToken',
        refreshToken: 'newRefreshToken',
      });

      const result = await controller.kakaoSignup(body, res as Response);
      expect(authService.join).toHaveBeenCalledWith(body.user);
      expect(res.cookie).toHaveBeenCalledWith(
        'accessToken',
        'newAccessToken',
        expect.any(Object),
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'newRefreshToken',
        expect.any(Object),
      );
      expect(result).toEqual({
        message: '회원가입 완료',
        user: { _id: 'newUserId' },
      });
    });
  });

  describe('logout', () => {
    it('should clear cookies and logout', async () => {
      const res: Partial<Response> = {
        clearCookie: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      controller.logout(res as Response);
      expect(res.clearCookie).toHaveBeenCalledWith(
        'accessToken',
        expect.any(Object),
      );
      expect(res.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.any(Object),
      );
      expect(authService.logout).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({ message: '로그아웃 완료' });
    });
  });
});
