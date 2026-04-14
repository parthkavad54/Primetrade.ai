import { Router } from 'express';
import { asyncHandler } from '../lib/async-handler';
import { requireAuth } from '../middleware/auth';
import {
  createTask,
  deleteTask,
  getTaskById,
  listTasks,
  updateTask
} from '../services/task.service';
import { createTaskSchema, taskQuerySchema, updateTaskSchema } from '../schemas/task';

export const taskRouter = Router();

taskRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const filters = taskQuerySchema.parse(req.query);
    const tasks = await listTasks(req.user!, filters);
    res.json({ tasks });
  })
);

taskRouter.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const payload = createTaskSchema.parse(req.body);
    const task = await createTask(req.user!, payload);
    res.status(201).json({ task });
  })
);

taskRouter.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const taskId = String(req.params.id);
    const task = await getTaskById(req.user!, taskId);
    res.json({ task });
  })
);

taskRouter.patch(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const payload = updateTaskSchema.parse(req.body);
    const taskId = String(req.params.id);
    const task = await updateTask(req.user!, taskId, payload);
    res.json({ task });
  })
);

taskRouter.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const taskId = String(req.params.id);
    await deleteTask(req.user!, taskId);
    res.status(204).send();
  })
);