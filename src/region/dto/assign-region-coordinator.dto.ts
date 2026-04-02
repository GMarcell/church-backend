import { IsOptional, IsUUID } from 'class-validator';

export class AssignRegionCoordinatorDto {
  @IsOptional()
  @IsUUID()
  memberId?: string | null;
}
