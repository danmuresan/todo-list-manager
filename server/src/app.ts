import express, { Request, Response } from 'express';
import cors from 'cors';
import { container } from './di/container';
import createAuthRouter from './routes/auth';
import createListsRouter from './routes/lists';
import createTodosRouter from './routes/todos';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response): Response => {
    return res.json({ ok: true });
});

app.use('/auth', createAuthRouter());
app.use('/lists', createListsRouter(container));
app.use('/todos', createTodosRouter(container));

export default app;
