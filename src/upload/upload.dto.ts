import { IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export enum imageSizes {
  large = 'large',
  medium = 'medium',
  thumbnail = 'thumb',
}
export class UploadDto {

  @IsEnum(imageSizes)
  @IsNotEmpty()
  @IsOptional()
  imageSize: imageSizes;


}
