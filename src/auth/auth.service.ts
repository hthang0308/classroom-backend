import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

import { MailService } from '../mail/mail.service';
import { UserService } from '../user/user.service';
import { hashPassword, validatePassword } from '../utils';

import { ForgotPasswordDto, LoginDto, ResetPasswordDto } from './dtos/auth.dto';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);
  private googleClient: OAuth2Client;

  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET'),
      `${this.configService.get('BASE_URL')}/auth/google/callback`,
    );
  }

  async login(data: LoginDto) {
    const user = await this.userService.findByEmail(data.email);

    if (!user) {
      throw new BadRequestException('Invalid email');
    }

    if (!validatePassword(data.password, user.password)) {
      throw new BadRequestException('Invalid password');
    }

    //TODO: uncomment this when app is ready for production
    if (!user.isEmailVerified) {
      throw new BadRequestException('Email is not verified');
    }

    //generate jwt token
    const token = this.userService.generateJWT(user);

    return {
      token: token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        isLoggedInWithGoogle: user.isLoggedInWithGoogle,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async signUp(data: LoginDto) {
    const user = await this.userService.findByEmail(data.email);

    if (user) {
      throw new BadRequestException('Email already exists');
    }

    const newUser = await this.userService.create({
      name: data.name,
      email: data.email,
      password: hashPassword(data.password),
    });
    // send email
    const confirmationToken =
      this.userService.generateJWTAsVerificationCode(newUser);
    await this.mailService.sendUserConfirmation(newUser, confirmationToken);
    return {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
    };
  }

  async getGoogleRedirectLink() {
    const url = this.googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: ['profile', 'email'],
      //let user select account
      prompt: 'select_account',
    });
    return url;
  }

  async loginGoogle(code) {
    const { tokens } = await this.googleClient.getToken(code);
    const ticket = await this.googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience:
        '854978946487-4ghr067l2tv525p5jjs4ol6gbhiv8gkg.apps.googleusercontent.com',
    });

    const payload = ticket.getPayload();
    const email = payload['email'];
    const name = payload['name'];

    let user = await this.userService.findByEmail(email);

    if (!user) {
      user = await this.userService.create({
        email: email,
        name: name,
        isLoggedInWithGoogle: true,
        password: 'nopassword',
        isEmailVerified: true,
      });
    }

    //generate jwt token
    const token = this.userService.generateJWT(user);

    return {
      token: token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        isLoggedInWithGoogle: user.isLoggedInWithGoogle,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async confirmAccount(token) {
    const user = await this.userService.verifyEmail(token);
    return user;
  }

  async forgotPassword(data: ForgotPasswordDto) {
    const user = await this.userService.findByEmail(data.email);

    if (!user) {
      throw new BadRequestException('Email not found');
    }

    // Generate reset token
    const resetToken = this.userService.generateJWTAsVerificationCode(user);

    // Send reset password email
    await this.mailService.sendPasswordResetEmail(user, resetToken);

    return {
      message: 'Password reset instructions have been sent to your email',
    };
  }

  async resetPassword(data: ResetPasswordDto) {
    const user = await this.userService.verifyResetToken(data.token);

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Update password
    user.password = hashPassword(data.newPassword);
    await this.userService.update(user._id, user);

    return {
      message: 'Password has been reset successfully',
    };
  }
}
