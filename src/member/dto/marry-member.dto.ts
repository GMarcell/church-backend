import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Gender, MemberRole } from '@prisma/client';

export class MarriageSpouseDto {
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
}

export class MarryMemberDto {
  @IsString()
  @IsNotEmpty()
  familyName: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsUUID()
  newFamilyHeadId?: string;

  @IsOptional()
  @IsEnum(MemberRole)
  roleInNewFamily?: MemberRole;

  @IsOptional()
  @ValidateNested()
  @Type(() => MarriageSpouseDto)
  spouse?: MarriageSpouseDto;
}
