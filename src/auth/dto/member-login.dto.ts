import { IsString, Matches } from 'class-validator';

export class MemberLoginDto {
  @IsString()
  name: string;

  @IsString()
  @Matches(/^\d{2}-\d{2}-\d{4}$/, {
    message: 'password must be in dd-mm-yyyy format',
  })
  password: string;
}
