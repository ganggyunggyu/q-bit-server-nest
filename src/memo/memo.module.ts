import { Module } from '@nestjs/common';
import { MemoService } from './memo.service';
import { MemoController } from './memo.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Memo, MemoSchema } from './schema/memo.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Memo.name, schema: MemoSchema }]),
  ],
  controllers: [MemoController],
  providers: [MemoService],
})
export class MemoModule {}
