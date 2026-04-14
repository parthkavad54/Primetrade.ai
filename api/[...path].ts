import { app } from '../backend/src/app';
import { connectMongo } from '../backend/src/lib/mongo';

let startupPromise: Promise<void> | null = null;

async function ensureDatabaseConnection() {
  if (!startupPromise) {
    startupPromise = connectMongo().then(() => undefined);
  }

  await startupPromise;
}

export default async function handler(req: unknown, res: unknown) {
  await ensureDatabaseConnection();
  return app(req as never, res as never);
}