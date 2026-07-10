import { RoleCode } from '@rotary/shared-types';
import { hasMinimumRole } from './rbac';

describe('hasMinimumRole', () => {
  it('grants access when user role meets minimum requirement', () => {
    expect(hasMinimumRole([RoleCode.MEMBER], [RoleCode.MEMBER])).toBe(true);
    expect(hasMinimumRole([RoleCode.ADMIN], [RoleCode.MEMBER])).toBe(true);
    expect(hasMinimumRole([RoleCode.PRESIDENT], [RoleCode.SECRETARY])).toBe(true);
  });

  it('denies access when user role is below requirement', () => {
    expect(hasMinimumRole([RoleCode.MEMBER], [RoleCode.ADMIN])).toBe(false);
    expect(hasMinimumRole([RoleCode.COMMISSION_LEAD], [RoleCode.SECRETARY])).toBe(false);
  });

  it('returns true when no roles are required', () => {
    expect(hasMinimumRole([RoleCode.MEMBER], [])).toBe(true);
  });
});
