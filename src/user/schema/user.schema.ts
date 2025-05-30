import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  kakaoId: string;

  @Prop()
  nickname?: string;

  @Prop()
  profileImage?: string;

  // ...필요한 필드 추가
}

export const UserSchema = SchemaFactory.createForClass(User);
