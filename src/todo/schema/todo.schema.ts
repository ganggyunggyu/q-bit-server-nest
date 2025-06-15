import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TodoDocument = Todo & Document;

@Schema()
export class Todo {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ default: Date.now })
  createDate: Date;

  @Prop({ required: true })
  scheduledDate: Date;

  @Prop({ default: false })
  isComplete: boolean;

  @Prop({ required: true })
  content: string;
}

export const TodoSchema = SchemaFactory.createForClass(Todo);
