import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { env } from './config';
import { healthRouter } from './routes/health.routes';
import { authRouter } from './routes/auth.routes';
import { taskRouter } from './routes/task.routes';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { openApiSpec } from './openapi';

export const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
    credentials: true
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.get('/', (_req, res) => {
  res.json({
    name: 'Primetrade Assignment API',
    version: '1.0.0'
  });
});

app.use('/health', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/tasks', taskRouter);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.use(notFoundHandler);
app.use(errorHandler);