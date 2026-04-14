import { app } from './app';
import { env } from './config';
import { connectMongo } from './lib/mongo';

async function start() {
  await connectMongo();

  app.listen(env.PORT, () => {
    console.log(`Backend listening on http://localhost:${env.PORT}`);
  });
}

void start();