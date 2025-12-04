import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WeeklyReportDocument = HydratedDocument<WeeklyReport>;

@Schema({ timestamps: true })
export class WeeklyReport {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  weekStart: string;

  @Prop({ required: true })
  weekEnd: string;

  @Prop({ required: true })
  totalTodos: number;

  @Prop({ required: true })
  completedTodos: number;

  @Prop({ required: true })
  weeklyCompletionRate: number;

  @Prop({ type: [Object], required: true })
  dailyStats: {
    date: string;
    total: number;
    completed: number;
    completionRate: number;
  }[];

  @Prop({ required: true })
  summary: string;

  @Prop({ type: [String], default: [] })
  achievements: string[];

  @Prop({ type: [String], default: [] })
  improvements: string[];

  @Prop({ type: [String], default: [] })
  nextWeekSuggestions: string[];

  @Prop({ required: true })
  encouragement: string;
}

export const WeeklyReportSchema = SchemaFactory.createForClass(WeeklyReport);

WeeklyReportSchema.index({ userId: 1, weekStart: 1 }, { unique: true });
