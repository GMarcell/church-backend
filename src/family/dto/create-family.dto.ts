import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Gender, MemberRole } from '@prisma/client';

export class CreateFamilyMemberDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsDateString()
  birthDate: string;

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
}

export class CreateFamilyDto {
  @IsString()
  familyName: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsUUID()
  regionId: string;

  @IsOptional()
  @IsArray()
  members?: CreateFamilyMemberDto[];
}
