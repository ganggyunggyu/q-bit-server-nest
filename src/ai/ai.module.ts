import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { CertModule } from '../cert/cert.module';
import { TodoModule } from '../todo/todo.module';
import { WeeklyReport, WeeklyReportSchema } from './schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WeeklyReport.name, schema: WeeklyReportSchema },
    ]),
    CertModule,
    TodoModule,
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
