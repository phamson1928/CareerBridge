import { SetMetadata } from '@nestjs/common';
import { AdminPermission } from '../constants/admin-permissions.constants';

export const ADMIN_PERMISSION_KEY = 'admin_permission';
export const SUPER_ADMIN_ONLY_KEY = 'super_admin_only';

export const RequirePermission = (...permissions: AdminPermission[]) =>
  SetMetadata(ADMIN_PERMISSION_KEY, permissions);

export const SuperAdminOnly = () => SetMetadata(SUPER_ADMIN_ONLY_KEY, true);
