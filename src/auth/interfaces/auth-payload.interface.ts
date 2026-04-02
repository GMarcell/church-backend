import { MemberRole, Role } from '@prisma/client';

export interface AuthPayload {
  sub: string;
  authType: 'user' | 'member';
  email?: string;
  role?: Role;
  regionId?: string;
  isRegionCoordinator?: boolean;
  memberId?: string;
  name?: string;
  familyId?: string;
  memberRole?: MemberRole;
}
