import { ObjectId } from 'mongodb';
import { getCollections, type TaskDbRecord, type UserDbRecord } from '../lib/mongo';
import type { CurrentUser, PublicTask, PublicUser, TaskStatus } from '../models/types';
import { AppError } from '../lib/errors';

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toPublicUser(user: UserDbRecord): PublicUser {
  return {
    id: user._id instanceof ObjectId ? user._id.toString() : String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  };
}

function toPublicTask(task: TaskDbRecord, owner: UserDbRecord): PublicTask {
  return {
    id: task._id instanceof ObjectId ? task._id.toString() : String(task._id),
    title: task.title,
    description: task.description ?? null,
    status: task.status,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    owner: toPublicUser(owner)
  };
}

async function findVisibleTask(currentUser: CurrentUser, taskId: string) {
  if (!ObjectId.isValid(taskId)) {
    throw new AppError(404, 'Task not found');
  }

  const { tasks, users } = await getCollections();
  const taskObjectId = new ObjectId(taskId);
  const query =
    currentUser.role === 'ADMIN'
      ? { _id: taskObjectId }
      : { _id: taskObjectId, ownerId: new ObjectId(currentUser.id) };

  const task = await tasks.findOne(query);

  if (!task) {
    throw new AppError(404, 'Task not found');
  }

  const ownerId = String(task.ownerId);
  if (!ObjectId.isValid(ownerId)) {
    throw new AppError(404, 'Task owner not found');
  }

  const owner = await users.findOne({ _id: new ObjectId(ownerId) });

  if (!owner) {
    throw new AppError(404, 'Task owner not found');
  }

  return toPublicTask(task, owner);
}

export async function listTasks(
  currentUser: CurrentUser,
  filters: { status?: TaskStatus; search?: string }
) {
  const { tasks, users } = await getCollections();
  const query: any = {};

  if (currentUser.role !== 'ADMIN') {
    query.ownerId = new ObjectId(currentUser.id);
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.search) {
    const regex = new RegExp(escapeRegex(filters.search), 'i');
    query.$or = [{ title: regex }, { description: regex }];
  }

  const taskList = await tasks.find(query).sort({ updatedAt: -1 }).toArray();
  const ownerIds = [...new Set(taskList.map((task) => String(task.ownerId)))]
    .filter((ownerId) => ObjectId.isValid(ownerId))
    .map((ownerId) => new ObjectId(ownerId));
  const ownerList = await users.find({ _id: { $in: ownerIds } }).toArray();
  const ownerMap = new Map(ownerList.map((owner) => [String(owner._id), owner]));

  return taskList
    .map((task) => {
      const owner = ownerMap.get(String(task.ownerId));
      if (!owner) {
        return null;
      }

      return toPublicTask(task, owner);
    })
    .filter((task): task is PublicTask => task !== null);
}

export async function getTaskById(currentUser: CurrentUser, taskId: string) {
  return findVisibleTask(currentUser, taskId);
}

export async function createTask(
  currentUser: CurrentUser,
  input: { title: string; description?: string; status: TaskStatus; dueDate?: string | null }
) {
  const { tasks } = await getCollections();
  const now = new Date();
  const result = await tasks.insertOne({
    title: input.title,
    description: input.description ?? null,
    status: input.status,
    dueDate: input.dueDate ? new Date(input.dueDate) : null,
    ownerId: new ObjectId(currentUser.id),
    createdAt: now,
    updatedAt: now
  });

  return findVisibleTask(currentUser, result.insertedId.toString());
}

export async function updateTask(
  currentUser: CurrentUser,
  taskId: string,
  input: { title?: string; description?: string | null; status?: TaskStatus; dueDate?: string | null }
) {
  const { tasks } = await getCollections();

  if (!ObjectId.isValid(taskId)) {
    throw new AppError(404, 'Task not found');
  }

  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (input.title !== undefined) update.title = input.title;
  if (input.description !== undefined) update.description = input.description;
  if (input.status !== undefined) update.status = input.status;
  if (input.dueDate !== undefined) update.dueDate = input.dueDate ? new Date(input.dueDate) : null;

  const result = await tasks.updateOne(
    {
      _id: new ObjectId(taskId),
      ...(currentUser.role === 'ADMIN' ? {} : { ownerId: new ObjectId(currentUser.id) })
    },
    { $set: update }
  );

  if (result.matchedCount === 0) {
    throw new AppError(404, 'Task not found');
  }

  return findVisibleTask(currentUser, taskId);
}

export async function deleteTask(currentUser: CurrentUser, taskId: string) {
  const { tasks } = await getCollections();

  if (!ObjectId.isValid(taskId)) {
    throw new AppError(404, 'Task not found');
  }

  const result = await tasks.deleteOne({
    _id: new ObjectId(taskId),
    ...(currentUser.role === 'ADMIN' ? {} : { ownerId: new ObjectId(currentUser.id) })
  });

  if (result.deletedCount === 0) {
    throw new AppError(404, 'Task not found');
  }

  return { success: true };
}