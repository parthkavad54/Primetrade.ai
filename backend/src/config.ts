import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1),
  MONGODB_DB_NAME: z.string().min(1).default('primetrade'),
  JWT_SECRET: z.string().min(32).default('change-me-to-a-long-secret-change-me!'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  COOKIE_NAME: z.string().default('pt_access'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  ADMIN_SEED_EMAIL: z.string().email().default('admin@primetrade.ai'),
  ADMIN_SEED_PASSWORD: z.string().min(8).default('Admin123!')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration');
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';