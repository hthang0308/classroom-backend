import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { ForgotPasswordDto, LoginDto, ResetPasswordDto } from './dtos/auth.dto';

@Controller('/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Post('/sign-in')
  async login(@Res() res, @Body() body: LoginDto) {
    const user = await this.authService.login(body);
    res.cookie('token', user.token);
    res.cookie('user', JSON.stringify(user.user));
    res.json({
      data: user,
      message: 'Login successfully',
    });
  }

  @Post('/sign-up')
  async signUp(@Body() body: LoginDto) {
    const user = await this.authService.signUp(body);
    return {
      data: user,
      message:
        'Please check your email to confirm your account (Check spam folder too)',
    };
  }

  @Get('/google')
  async loginGoogle(@Res() res) {
    const url = await this.authService.getGoogleRedirectLink();
    return res.redirect(url);
  }

  @Get('/google/callback')
  async loginGoogleCallback(@Query('code') code, @Res() res) {
    const user = await this.authService.loginGoogle(code);
    res.cookie('token', user.token);
    res.cookie('user', JSON.stringify(user.user));
    return res.redirect(this.configService.get('FRONTEND_URL'));
  }

  @Get('/confirm')
  async confirmAccount(@Query('token') token) {
    const user = await this.authService.confirmAccount(token);

    //return successful message then redirect to login page
    return {
      data: user,
      message: 'Confirm account successfully',
    };
  }

  @Post('/forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return await this.authService.forgotPassword(body);
  }

  @Post('/reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    return await this.authService.resetPassword(body);
  }
}
