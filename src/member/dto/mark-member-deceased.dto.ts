import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class MarkMemberDeceasedDto {
  @IsOptional()
  @IsDateString()
  deathDate?: string;

  @IsOptional()
  @IsUUID()
  newFamilyHeadId?: string;
}
