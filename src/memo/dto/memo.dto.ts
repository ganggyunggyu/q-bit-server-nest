import {
  IsDateString,
  IsNotEmpty,
  IsString,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateMemoDto {
  @IsDateString()
  @IsNotEmpty()
  scheduledDate: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;
}

export class UpdateMemoDto {
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  content?: string;
}

export class GetMemoFilterDto {
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;
}
