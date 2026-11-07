import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from '../../generated/prisma/client';
import { AdminPermission } from '../constants/admin-permissions.constants';
import {
  ADMIN_PERMISSION_KEY,
  SUPER_ADMIN_ONLY_KEY,
} from '../decorators/admin-permissions.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard - Sub-Admin and Super Admin RBAC', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(user: any): ExecutionContext {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('allows Super Admin (isSuperAdmin: true) to access @SuperAdminOnly endpoint', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === ROLES_KEY) return [Role.ADMIN];
      if (key === SUPER_ADMIN_ONLY_KEY) return true;
      return null;
    });

    const context = createMockContext({
      id: 'super-admin-id',
      email: 'admin@test.com',
      role: Role.ADMIN,
      isSuperAdmin: true,
      permissions: [],
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('blocks Sub-Admin (isSuperAdmin: false) from accessing @SuperAdminOnly endpoint', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === ROLES_KEY) return [Role.ADMIN];
      if (key === SUPER_ADMIN_ONLY_KEY) return true;
      return null;
    });

    const context = createMockContext({
      id: 'sub-admin-id',
      email: 'subadmin@test.com',
      role: Role.ADMIN,
      isSuperAdmin: false,
      permissions: [AdminPermission.COMPANIES],
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    try {
      guard.canActivate(context);
    } catch (err: any) {
      expect(err.getResponse()).toMatchObject({ code: 'SUPER_ADMIN_REQUIRED' });
    }
  });

  it('allows Sub-Admin with COMPANIES permission to access @RequirePermission(COMPANIES)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === ROLES_KEY) return [Role.ADMIN];
      if (key === ADMIN_PERMISSION_KEY) return [AdminPermission.COMPANIES];
      return null;
    });

    const context = createMockContext({
      id: 'sub-admin-id',
      email: 'subadmin@test.com',
      role: Role.ADMIN,
      isSuperAdmin: false,
      permissions: [AdminPermission.COMPANIES],
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('blocks Sub-Admin WITHOUT COMPANIES permission from accessing @RequirePermission(COMPANIES)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === ROLES_KEY) return [Role.ADMIN];
      if (key === ADMIN_PERMISSION_KEY) return [AdminPermission.COMPANIES];
      return null;
    });

    const context = createMockContext({
      id: 'sub-admin-id',
      email: 'subadmin@test.com',
      role: Role.ADMIN,
      isSuperAdmin: false,
      permissions: [AdminPermission.SUPPORT],
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    try {
      guard.canActivate(context);
    } catch (err: any) {
      expect(err.getResponse()).toMatchObject({
        code: 'ADMIN_PERMISSION_DENIED',
      });
    }
  });

  it('allows Super Admin to access any module even if permissions array is empty', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === ROLES_KEY) return [Role.ADMIN];
      if (key === ADMIN_PERMISSION_KEY) return [AdminPermission.SEMESTERS];
      return null;
    });

    const context = createMockContext({
      id: 'super-admin-id',
      email: 'admin@test.com',
      role: Role.ADMIN,
      isSuperAdmin: true,
      permissions: [],
    });

    expect(guard.canActivate(context)).toBe(true);
  });
});
