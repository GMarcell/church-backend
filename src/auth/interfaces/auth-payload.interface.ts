import { Role } from '@prisma/client';

export interface AuthPayload {
  sub: string;
  authType: 'user';
  email: string;
  role: Role;
  regionId?: string;
}
