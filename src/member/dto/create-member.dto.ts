import {
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
  IsEmail,
  IsBoolean,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';
import { Gender, MemberRole } from '@prisma/client';

export class CreateMemberDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsDateString()
  birthDate: string; // ISO string from frontend

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsEnum(MemberRole)
  role: MemberRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsUUID()
  familyId: string;
}
