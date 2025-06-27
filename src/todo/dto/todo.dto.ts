import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  ValidateNested,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TodoInput {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsBoolean()
  isComplete?: boolean;
}

export class MemoInput {
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class CreateTodoDto {
  @IsDateString()
  scheduledDate: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TodoInput)
  todos: TodoInput[];

  @ValidateNested()
  @Type(() => MemoInput)
  memo: MemoInput;
}
export class UpdateTodoDto {
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsBoolean()
  isComplete?: boolean;
}
