import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class UserSessionGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = (request.headers['authorization'] || '') as string;
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

    if (!token) {
      throw new UnauthorizedException('Authentication required. Please log in.');
    }

    const userId = this.authService.validateSession(token);
    if (!userId) {
      throw new UnauthorizedException('Session expired or invalid. Please log in again.');
    }

    this.authService.activateUser(userId);
    request.userId = userId;
    request.authToken = token;
    return true;
  }
}