export const RoleCode = {
  ADMIN: 'ADMIN',
  PRESIDENT: 'PRESIDENT',
  SECRETARY: 'SECRETARY',
  TREASURER: 'TREASURER',
  COMMISSION_LEAD: 'COMMISSION_LEAD',
  MEMBER: 'MEMBER',
} as const;

export type RoleCode = (typeof RoleCode)[keyof typeof RoleCode];

export const ROLE_LABELS: Record<RoleCode, string> = {
  [RoleCode.ADMIN]: 'Administrateur',
  [RoleCode.PRESIDENT]: 'Président',
  [RoleCode.SECRETARY]: 'Secrétaire',
  [RoleCode.TREASURER]: 'Trésorier',
  [RoleCode.COMMISSION_LEAD]: 'Responsable de commission',
  [RoleCode.MEMBER]: 'Membre',
};

/** Hiérarchie simplifiée pour les guards RBAC */
export const ROLE_HIERARCHY: Record<RoleCode, number> = {
  [RoleCode.ADMIN]: 100,
  [RoleCode.PRESIDENT]: 90,
  [RoleCode.SECRETARY]: 80,
  [RoleCode.TREASURER]: 80,
  [RoleCode.COMMISSION_LEAD]: 60,
  [RoleCode.MEMBER]: 10,
};
