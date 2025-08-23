import express, { Request, Response } from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import listsRouter from './routes/lists';
import todosRouter from './routes/todos';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.use('/auth', authRouter);
app.use('/lists', listsRouter);
app.use('/todos', todosRouter);

export default app;
