import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigurationModule } from './config/configuration.module';
import { GroupModule } from './group/group.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [ConfigurationModule, AuthModule, GroupModule, HealthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
