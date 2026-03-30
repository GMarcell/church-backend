import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateFamilyDto {
  @IsOptional()
  @IsString()
  familyName?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsUUID()
  regionId?: string;
}
