import { IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateFamilyDto {
  @IsString()
  familyName: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsUUID()
  regionId: string;
}
