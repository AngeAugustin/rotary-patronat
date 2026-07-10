import { randomInt } from 'crypto';

const ALPHANUMERIC =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function generatePassword(length = 12): string {
  let password = '';
  for (let i = 0; i < length; i += 1) {
    password += ALPHANUMERIC[randomInt(ALPHANUMERIC.length)];
  }
  return password;
}
