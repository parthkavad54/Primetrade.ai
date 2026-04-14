import type { CurrentUser, PublicTask, TaskStatus } from '../models/types';
import {
  createTask as createTaskRecord,
  deleteTask as deleteTaskRecord,
  getTaskById as getTaskRecordById,
  listTasks as listTaskRecords,
  updateTask as updateTaskRecord
} from '../repositories/tasks.repository';

export async function listTasks(
  currentUser: CurrentUser,
  filters: { status?: TaskStatus; search?: string }
) {
  return listTaskRecords(currentUser, filters);
}

export async function getTaskById(currentUser: CurrentUser, taskId: string) {
  return getTaskRecordById(currentUser, taskId);
}

export async function createTask(
  currentUser: CurrentUser,
  input: { title: string; description?: string; status: TaskStatus; dueDate?: string | null }
) {
  return createTaskRecord(currentUser, input);
}

export async function updateTask(
  currentUser: CurrentUser,
  taskId: string,
  input: { title?: string; description?: string | null; status?: TaskStatus; dueDate?: string | null }
) {
  return updateTaskRecord(currentUser, taskId, input);
}

export async function deleteTask(currentUser: CurrentUser, taskId: string) {
  return deleteTaskRecord(currentUser, taskId);
}