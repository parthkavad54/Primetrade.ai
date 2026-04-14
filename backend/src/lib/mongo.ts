import { MongoClient, type Collection, type Db } from 'mongodb';
import { env } from '../config';

export type UserDbRecord = {
  _id?: unknown;
  name: string;
  email: string;
  passwordHash: string;
  role: 'USER' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
};

export type TaskDbRecord = {
  _id?: unknown;
  title: string;
  description?: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  dueDate?: Date | null;
  ownerId: unknown;
  createdAt: Date;
  updatedAt: Date;
};

let client: MongoClient | null = null;
let database: Db | null = null;

export async function connectMongo() {
  if (database) {
    return database;
  }

  if (!client) {
    client = new MongoClient(env.MONGODB_URI);
  }

  await client.connect();
  database = client.db(env.MONGODB_DB_NAME);

  await Promise.all([
    database.collection<UserDbRecord>('users').createIndex({ email: 1 }, { unique: true }),
    database.collection<TaskDbRecord>('tasks').createIndex({ ownerId: 1 }),
    database.collection<TaskDbRecord>('tasks').createIndex({ status: 1 })
  ]);

  return database;
}

export async function getDb() {
  if (!database) {
    return connectMongo();
  }

  return database;
}

export async function getCollections() {
  const db = await getDb();

  return {
    users: db.collection<UserDbRecord>('users') as Collection<UserDbRecord>,
    tasks: db.collection<TaskDbRecord>('tasks') as Collection<TaskDbRecord>
  };
}