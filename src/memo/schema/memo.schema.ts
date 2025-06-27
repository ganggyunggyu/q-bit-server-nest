import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MemoDocument = Memo & Document;

@Schema()
export class Memo {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ default: Date.now })
  createDate: Date;

  @Prop({ required: true })
  scheduledDate: Date;

  @Prop({ required: true })
  content: string;
}

export const MemoSchema = SchemaFactory.createForClass(Memo);
