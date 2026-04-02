import { IsOptional, IsUUID } from 'class-validator';

export class AssignRegionCoordinatorDto {
  @IsOptional()
  @IsUUID()
  coordinatorId?: string | null;
}
