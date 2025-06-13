import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User &
  Document & {
    interestedCerts: Types.ObjectId[];
  };
export enum RemindType {
  DEFAULT = 'default',
  MINIMAL = 'minimal',
  OFTEN = 'often',
}

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  kakaoId: string;

  @Prop()
  email?: string;

  @Prop()
  displayName?: string;

  @Prop({ enum: RemindType, default: RemindType.DEFAULT })
  remindType?: RemindType;

  @Prop({ type: [Types.ObjectId], ref: 'Cert', default: [] })
  interestedCerts: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);
