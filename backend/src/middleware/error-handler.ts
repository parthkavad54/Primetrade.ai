import type { NextFunction, Request, Response } from 'express';
import { MongoServerError } from 'mongodb';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors';

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, 'Route not found'));
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: error.message,
      details: error.details ?? null
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: error.flatten().fieldErrors
    });
    return;
  }

  if (error instanceof MongoServerError) {
    if (error.code === 11000) {
      res.status(409).json({
        error: 'Resource already exists',
        details: { code: error.code }
      });
      return;
    }
  }

  console.error(error);
  res.status(500).json({
    error: 'Internal server error'
  });
}