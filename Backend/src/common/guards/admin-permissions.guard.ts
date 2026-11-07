import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../generated/prisma/client';
import {
  ADMIN_PERMISSION_KEY,
  SUPER_ADMIN_ONLY_KEY,
} from '../decorators/admin-permissions.decorator';
import { AdminPermission } from '../constants/admin-permissions.constants';
import { AuthUser } from '../../auth/types/auth-user.type';

@Injectable()
export class AdminPermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isSuperAdminOnly = this.reflector.getAllAndOverride<boolean>(
      SUPER_ADMIN_ONLY_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredPermissions = this.reflector.getAllAndOverride<
      AdminPermission[]
    >(ADMIN_PERMISSION_KEY, [context.getHandler(), context.getClass()]);

    // If neither decorator is used, allow request to proceed
    if (
      !isSuperAdminOnly &&
      (!requiredPermissions || requiredPermissions.length === 0)
    ) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException({
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required',
      });
    }

    // Non-ADMIN roles are handled by RolesGuard
    if (user.role !== Role.ADMIN) {
      return true;
    }

    // Super Admin has full access to everything
    if (user.isSuperAdmin) {
      return true;
    }

    // If this endpoint strictly requires Super Admin, block sub-admins
    if (isSuperAdminOnly) {
      throw new ForbiddenException({
        code: 'SUPER_ADMIN_REQUIRED',
        message:
          'Chỉ Quản trị viên tối cao mới có quyền thực hiện thao tác này',
      });
    }

    // For module endpoints, verify that the sub-admin has at least one of the required permissions
    const userPermissions = user.permissions || [];
    const hasPermission = requiredPermissions?.some((perm) =>
      userPermissions.includes(perm),
    );

    if (!hasPermission) {
      throw new ForbiddenException({
        code: 'ADMIN_PERMISSION_DENIED',
        message: 'Bạn không có quyền truy cập vào phân hệ này',
      });
    }

    return true;
  }
}
