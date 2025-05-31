import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CertService } from './cert.service';
import { CertController } from './cert.controller';
import { Cert, CertSchema } from './schema/cert.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Cert.name, schema: CertSchema }]),
  ],
  controllers: [CertController],
  providers: [CertService],
})
export class CertModule {}
