import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  kakaoId: string;

  @Prop()
  email?: string;

  @Prop()
  nickname?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
