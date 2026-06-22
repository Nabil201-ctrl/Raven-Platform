import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserSessionGuard } from '../common/guards/user-session.guard';

@Global()
@Module({
  providers: [AuthService, UserSessionGuard],
  exports: [AuthService, UserSessionGuard],
})
export class AuthModule {}