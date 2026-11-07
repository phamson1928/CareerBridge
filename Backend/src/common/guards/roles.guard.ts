import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../generated/prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import {
  ADMIN_PERMISSION_KEY,
  SUPER_ADMIN_ONLY_KEY,
} from '../decorators/admin-permissions.decorator';
import { AdminPermission } from '../constants/admin-permissions.constants';
import { AuthUser } from '../../auth/types/auth-user.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const isSuperAdminOnly = this.reflector.getAllAndOverride<boolean>(
      SUPER_ADMIN_ONLY_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredPermissions = this.reflector.getAllAndOverride<
      AdminPermission[]
    >(ADMIN_PERMISSION_KEY, [context.getHandler(), context.getClass()]);

    if (
      (!requiredRoles || requiredRoles.length === 0) &&
      !isSuperAdminOnly &&
      (!requiredPermissions || requiredPermissions.length === 0)
    ) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    if (!request.user) {
      throw new UnauthorizedException({
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required',
      });
    }

    const { user } = request;

    // 1. Role verification
    if (
      requiredRoles &&
      requiredRoles.length > 0 &&
      !requiredRoles.includes(user.role)
    ) {
      throw new ForbiddenException({
        code: 'FORBIDDEN_ROLE',
        message: 'You do not have permission to access this resource',
      });
    }

    // 2. Admin Permission checks (applicable when user.role === Role.ADMIN)
    if (user.role === Role.ADMIN) {
      // Super Admin bypasses all sub-admin permission checks
      if (user.isSuperAdmin) {
        return true;
      }

      // If endpoint requires Super Admin only, block sub-admins
      if (isSuperAdminOnly) {
        throw new ForbiddenException({
          code: 'SUPER_ADMIN_REQUIRED',
          message:
            'Chỉ Quản trị viên tối cao mới có quyền thực hiện thao tác này',
        });
      }

      // If endpoint requires specific admin permission(s), verify sub-admin has it
      if (requiredPermissions && requiredPermissions.length > 0) {
        const userPermissions = user.permissions || [];
        const hasPermission = requiredPermissions.some((perm) =>
          userPermissions.includes(perm),
        );
        if (!hasPermission) {
          throw new ForbiddenException({
            code: 'ADMIN_PERMISSION_DENIED',
            message: 'Bạn không có quyền truy cập vào phân hệ này',
          });
        }
      }
    }

    return true;
  }
}
