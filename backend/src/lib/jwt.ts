import jwt from 'jsonwebtoken';
import { env } from '../config';
import type { Role } from '../models/types';

export type AccessTokenPayload = {
  email: string;
  name: string;
  role: Role;
};

export function signAccessToken(userId: string, payload: AccessTokenPayload) {
  return jwt.sign({ ...payload, sub: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload & AccessTokenPayload;
}