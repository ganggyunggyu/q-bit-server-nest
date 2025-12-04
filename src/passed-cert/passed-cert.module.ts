import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassedCertController } from './passed-cert.controller';
import { PassedCertService } from './passed-cert.service';
import { PassedCert, PassedCertSchema } from './schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PassedCert.name, schema: PassedCertSchema },
    ]),
  ],
  controllers: [PassedCertController],
  providers: [PassedCertService],
  exports: [PassedCertService],
})
export class PassedCertModule {}
