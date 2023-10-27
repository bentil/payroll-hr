import crypto from 'crypto';
import util from 'util';

const ALPHA_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUM = '0123456789';

const randomBytesAsync = util.promisify(crypto.randomBytes);

export async function generateUrlOtpToken(): Promise<string> {
  return (await randomBytesAsync(128)).toString('base64url');
}

export function generateRandomAlphanum(length: number): string {
  const chars = ALPHA_UPPER + NUM;
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateRandomPassword(): string {
  return crypto.randomBytes(16).toString('hex');
}
