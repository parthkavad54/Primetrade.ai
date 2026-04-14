import { z } from 'zod';

export const taskStatusSchema = z.enum(['TODO', 'IN_PROGRESS', 'DONE']);

export const taskQuerySchema = z.object({
  status: taskStatusSchema.optional(),
  search: z.string().trim().min(1).max(120).optional()
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(1000).optional().or(z.literal('')).transform((value) => {
    if (!value) {
      return undefined;
    }

    return value;
  }),
  status: taskStatusSchema.default('TODO'),
  dueDate: z.string().datetime().optional().nullable()
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  title: z.string().trim().min(3).max(120).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  status: taskStatusSchema.optional(),
  dueDate: z.string().datetime().optional().nullable()
});