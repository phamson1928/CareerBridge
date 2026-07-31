import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(
    err: Error | null,
    user: TUser | false | null,
  ): TUser {
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException({
          code: 'ACCESS_TOKEN_INVALID',
          message: 'Access token is invalid or expired',
        })
      );
    }
    return user;
  }
}
