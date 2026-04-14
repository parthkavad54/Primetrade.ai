import { Router } from 'express';
import { asyncHandler } from '../lib/async-handler';
import { authCookieOptions, clearAuthCookieOptions } from '../lib/cookies';
import { requireAuth } from '../middleware/auth';
import { getCurrentUser, loginUser, registerUser } from '../services/auth.service';
import { loginSchema, registerSchema } from '../schemas/auth';
import { env } from '../config';

export const authRouter = Router();

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const payload = registerSchema.parse(req.body);
    const user = await registerUser(payload);
    const token = await loginUser({ email: payload.email, password: payload.password }).then((result) => result.token);

    res.cookie(env.COOKIE_NAME, token, authCookieOptions());
    res.status(201).json({ user });
  })
);

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const payload = loginSchema.parse(req.body);
    const result = await loginUser(payload);

    res.cookie(env.COOKIE_NAME, result.token, authCookieOptions());
    res.status(200).json({ user: result.user });
  })
);

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(env.COOKIE_NAME, clearAuthCookieOptions());
  res.status(204).send();
});

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const user = await getCurrentUser(req.user.id);
    res.json({ user });
  })
);