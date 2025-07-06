import { Test, TestingModule } from '@nestjs/testing';
import { CertController } from './cert.controller';
import { CertService } from './cert.service';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';
import { Types } from 'mongoose';

describe('CertController', () => {
  let controller: CertController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CertController],
      providers: [
        {
          provide: CertService,
          useValue: {
            // Mock methods of CertService as needed
            // e.g., createCert: jest.fn(),
            // getCert: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest();
          request.user = { _id: new Types.ObjectId() }; // Mock user
          return true;
        },
      })
      .compile();

    controller = module.get<CertController>(CertController);
    module.get<CertService>(CertService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
