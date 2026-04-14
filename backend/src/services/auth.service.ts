import { ObjectId } from 'mongodb';
import { hashPassword, verifyPassword } from '../lib/password';
import { AppError } from '../lib/errors';
import { signAccessToken } from '../lib/jwt';
import { createUser, findUserByEmail, findUserById } from '../repositories/users.repository';
import type { PublicUser, Role } from '../models/types';

function sanitizeUser(user: {
  _id: unknown;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}): PublicUser {
  const userId = user._id instanceof ObjectId ? user._id.toString() : String(user._id);

  return {
    id: userId,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  };
}

export async function registerUser(input: { name: string; email: string; password: string }) {
  const existingUser = await findUserByEmail(input.email);

  if (existingUser) {
    throw new AppError(409, 'Email is already registered');
  }

  const user = await createUser({
    name: input.name,
    email: input.email,
    passwordHash: await hashPassword(input.password),
    role: 'USER'
  });

  if (!user) {
    throw new AppError(500, 'Unable to create user');
  }

  return sanitizeUser(user);
}

export async function loginUser(input: { email: string; password: string }) {
  const user = await findUserByEmail(input.email);

  if (!user) {
    throw new AppError(401, 'Invalid email or password');
  }

  const passwordMatches = await verifyPassword(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError(401, 'Invalid email or password');
  }

  return {
    user: sanitizeUser(user),
    token: signAccessToken(String(user._id), {
      email: user.email,
      name: user.name,
      role: user.role
    })
  };
}

export async function getCurrentUser(userId: string) {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  return sanitizeUser(user);
}