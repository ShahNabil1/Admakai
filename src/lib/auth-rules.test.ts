import { describe, expect, it } from 'vitest';
import { isOtp, normalizeOtp, passwordError } from './auth-rules';

describe('password length', () => {
  it('rejects 7 characters', () => expect(passwordError('abcdefg')).not.toBeNull());
  it('accepts 8 characters', () => expect(passwordError('abcdefgh')).toBeNull());
  it('accepts 16 characters', () => expect(passwordError('a'.repeat(16))).toBeNull());
  it('rejects 17 characters', () => expect(passwordError('a'.repeat(17))).not.toBeNull());
});

describe('six digit code', () => {
  it('converts Bangla digits', () => expect(normalizeOtp('১২৩৪৫৬')).toBe('123456'));
  it('caps at six digits', () => expect(normalizeOtp('12 34 5678')).toBe('123456'));
  it('requires exactly six', () => { expect(isOtp('12345')).toBe(false); expect(isOtp('123456')).toBe(true); });
});
