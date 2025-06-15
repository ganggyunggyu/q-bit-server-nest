import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CertService } from './cert.service';
import { CertController } from './cert.controller';
import { Cert, CertSchema } from './schema/cert.schema';
import { User, UserSchema } from 'src/user/schema/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Cert.name, schema: CertSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [CertController],
  providers: [CertService],
})
export class CertModule {}
