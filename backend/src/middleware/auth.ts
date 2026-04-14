import type { NextFunction, Request, Response } from 'express';
import { env } from '../config';
import { AppError } from '../lib/errors';
import { verifyAccessToken } from '../lib/jwt';
import type { Role } from '../models/types';

declare global {
  namespace Express {
    interface AuthenticatedUser {
      id: string;
      email: string;
      name: string;
      role: Role;
    }

    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

function readToken(req: Request) {
  const cookieToken = req.cookies?.[env.COOKIE_NAME] as string | undefined;
  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = req.header('authorization');
  if (!authHeader) {
    return undefined;
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return undefined;
  }

  return token;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = readToken(req);

  if (!token) {
    next(new AppError(401, 'Authentication required'));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    if (!payload.sub) {
      next(new AppError(401, 'Invalid authentication token'));
      return;
    }

    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role
    };
    next();
  } catch {
    next(new AppError(401, 'Authentication token expired or invalid'));
  }
}