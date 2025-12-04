import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PassedCertDocument = HydratedDocument<PassedCert>;

export enum PassedCertType {
  WRITTEN = 'written',
  PRACTICAL = 'practical',
  FINAL = 'final',
}

@Schema({ timestamps: true })
export class PassedCert {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Cert' })
  certId: Types.ObjectId;

  @Prop({ required: true })
  passedDate: Date;

  @Prop()
  score?: number;

  @Prop({ required: true, enum: PassedCertType })
  type: PassedCertType;

  @Prop()
  memo?: string;
}

export const PassedCertSchema = SchemaFactory.createForClass(PassedCert);
