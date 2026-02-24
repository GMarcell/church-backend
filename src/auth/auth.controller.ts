import { Controller, Post, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.authService.register(body.email, body.password, body.role);
  }

  @Post('login')
  async login(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.login(body.email, body.password);

    console.log(data);

    res.cookie('access_token', data?.access_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    });

    return {
      message: 'Login successful',
    };
  }
}
