import crypto from 'crypto';
import util from 'util';
import config from '../config';

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

export function generateRandomAlpha(length: number): string {
  const chars = ALPHA_UPPER;
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateRandomNum(length: number): string {
  const chars = NUM;
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateDisciplinaryActionNumber(): string {
  const result = generateRandomAlpha(config.disciplinaryActionAlphaLength) 
    + generateRandomNum(config.disciplinaryActionDigitsLength);
  return result;
}

export function generateGrievanceReportNumber(): string {
  const result = generateRandomAlpha(config.grievanceReportAlphaLength) 
    + generateRandomNum(config.grievanceReportDigitsLength);
  return result;
}