import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateRegionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;
}
