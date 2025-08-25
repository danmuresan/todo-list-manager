import express, { Request, Response } from 'express';
import cors from 'cors';
import { container } from './di/di-container';
import createAuthRouter from './routes/auth';
import createTodoListsManagementRouter from './routes/todo-lists-management';
import createTodoItemRouter from './routes/todo-item-management';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response): Response => {
    return res.json({ ok: true });
});

app.use('/auth', createAuthRouter(container));
app.use('/lists', createTodoListsManagementRouter(container));
app.use('/todos', createTodoItemRouter(container));

export default app;
