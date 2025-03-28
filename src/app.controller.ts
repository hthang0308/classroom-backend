import { Controller, Get, Post, UseGuards, Res } from '@nestjs/common';

import { AppService } from './app.service';
import { JwtAuthGuard } from './guards/jwt.guard';

@Controller()
export class AppController {}
