import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CertDocument = Cert & Document;

export interface CertSchedule {
  round: string;
  writtenRegStart?: string;
  writtenRegEnd?: string;
  writtenExamStart?: string;
  writtenExamEnd?: string;
  writtenResultDate?: string;
  practicalRegStart?: string;
  practicalRegEnd?: string;
  practicalExamStart?: string;
  practicalExamEnd?: string;
  practicalResultDate?: string;
}

@Schema({ timestamps: true })
export class Cert {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  category?: string;

  @Prop()
  subCategory?: string;

  @Prop()
  type?: string;

  @Prop()
  grade?: string;

  @Prop()
  agency?: string;

  @Prop()
  description?: string;

  @Prop({ type: [Object] })
  schedule?: CertSchedule[];
}

export const CertSchema = SchemaFactory.createForClass(Cert);
