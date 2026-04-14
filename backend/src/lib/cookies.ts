import type { CookieOptions } from 'express';
import { isProduction } from '../config';

export function authCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    maxAge: 1000 * 60 * 60 * 24
  };
}

export function clearAuthCookieOptions(): CookieOptions {
  return {
    ...authCookieOptions(),
    maxAge: undefined
  };
}