import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export const EMAIL_LOGO_CID = 'club-logo';

export function resolveEmailLogoPath() {
  const candidates = [
    join(process.cwd(), 'assets', 'email', 'logo.png'),
    join(process.cwd(), '..', 'web', 'public', 'logo.png'),
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

export function loadEmailLogoBase64() {
  const logoPath = resolveEmailLogoPath();
  if (!logoPath) return null;

  return readFileSync(logoPath).toString('base64');
}
