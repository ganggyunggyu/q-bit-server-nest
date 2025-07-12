import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CertDocument = Cert & Document;

@Schema({ timestamps: true })
export class Cert {
  @Prop({ required: true, unique: true })
  jmcd: string;

  @Prop({ required: true })
  jmfldnm: string;

  @Prop()
  mdobligfldcd?: string;

  @Prop()
  mdobligfldnm?: string;

  @Prop()
  obligfldcd?: string;

  @Prop()
  obligfldnm?: string;

  @Prop()
  qualgbcd?: string;

  @Prop()
  qualgbnm?: string;

  @Prop()
  seriescd?: string;

  @Prop()
  seriesnm?: string;

  @Prop()
  outlook?: string;

  @Prop()
  agency?: string;

  @Prop({ type: [Object] })
  schedule?: any[];
}

export const CertSchema = SchemaFactory.createForClass(Cert);
