import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { CertService } from './cert.service';
import { CertController } from './cert.controller';
import { Cert, CertSchema } from './schema/cert.schema';
import { User, UserSchema } from 'src/user/schema/user.schema';
import { QnetScheduleService } from './qnet-schedule.service';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([{ name: Cert.name, schema: CertSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [CertController],
  providers: [CertService, QnetScheduleService],
  exports: [QnetScheduleService],
})
export class CertModule {}
