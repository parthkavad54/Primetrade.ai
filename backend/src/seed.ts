import { connectMongo } from './lib/mongo';
import { createUser, upsertUser } from './repositories/users.repository';
import { createTask } from './repositories/tasks.repository';
import { env } from './config';
import { hashPassword } from './lib/password';

async function main() {
  await connectMongo();

  const admin = await upsertUser({
    name: 'Admin',
    email: env.ADMIN_SEED_EMAIL,
    role: 'ADMIN',
    passwordHash: await hashPassword(env.ADMIN_SEED_PASSWORD)
  });

  const user = await upsertUser({
    name: 'Demo User',
    email: 'demo@primetrade.ai',
    role: 'USER',
    passwordHash: await hashPassword('DemoUser123!')
  });

  if (!admin || !user) {
    throw new Error('Failed to seed users');
  }

  await createTask(
    { id: admin._id.toString(), email: admin.email, name: admin.name, role: admin.role },
    {
      title: 'Review assignment brief',
      description: 'Confirm all deliverables and evaluation criteria.',
      status: 'DONE'
    }
  );

  await createTask(
    { id: user._id.toString(), email: user.email, name: user.name, role: user.role },
    {
      title: 'Build login flow',
      description: 'Exercise the auth endpoints from the frontend UI.',
      status: 'IN_PROGRESS'
    }
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });