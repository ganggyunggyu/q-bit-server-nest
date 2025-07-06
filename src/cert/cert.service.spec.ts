import { Test, TestingModule } from '@nestjs/testing';
import { CertService } from './cert.service';
import { getModelToken } from '@nestjs/mongoose';
import { Cert, CertDocument } from './schema/cert.schema';
import { User, UserDocument } from 'src/user/schema/user.schema';
import { Model } from 'mongoose';

describe('CertService', () => {
  let service: CertService;

  const mockCertModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
  };

  const mockUserModel = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertService,
        {
          provide: getModelToken(Cert.name),
          useValue: mockCertModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<CertService>(CertService);
    module.get<Model<CertDocument>>(getModelToken(Cert.name));
    module.get<Model<UserDocument>>(getModelToken(User.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
