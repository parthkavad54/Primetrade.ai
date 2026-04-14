import { ObjectId } from 'mongodb';
import { getCollections, type UserDbRecord } from '../lib/mongo';

export async function findUserByEmail(email: string) {
  const { users } = await getCollections();
  return users.findOne({ email: email.toLowerCase() });
}

export async function findUserById(userId: string) {
  if (!ObjectId.isValid(userId)) {
    return null;
  }

  const { users } = await getCollections();
  return users.findOne({ _id: new ObjectId(userId) });
}

export async function createUser(user: Pick<UserDbRecord, 'name' | 'email' | 'passwordHash' | 'role'>) {
  const { users } = await getCollections();
  const now = new Date();
  const result = await users.insertOne({
    name: user.name,
    email: user.email.toLowerCase(),
    passwordHash: user.passwordHash,
    role: user.role,
    createdAt: now,
    updatedAt: now
  });

  return users.findOne({ _id: result.insertedId });
}

export async function upsertUser(user: Pick<UserDbRecord, 'name' | 'email' | 'passwordHash' | 'role'>) {
  const { users } = await getCollections();
  const now = new Date();
  await users.updateOne(
    { email: user.email.toLowerCase() },
    {
      $set: {
        name: user.name,
        email: user.email.toLowerCase(),
        passwordHash: user.passwordHash,
        role: user.role,
        updatedAt: now
      },
      $setOnInsert: { createdAt: now }
    },
    { upsert: true }
  );

  return users.findOne({ email: user.email.toLowerCase() });
}