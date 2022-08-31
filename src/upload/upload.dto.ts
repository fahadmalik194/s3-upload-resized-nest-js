import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UploadDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  imageSize: string;
}
