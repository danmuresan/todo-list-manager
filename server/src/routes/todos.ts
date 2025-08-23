import { Router, Request, Response } from 'express';
import { newId } from '../ids';
import { authMiddleware, JwtPayload } from '../auth';
import { getDB, saveDB, Todo } from '../storage';
import { broadcast } from '../sse';

const router = Router();

const STATES: Todo['state'][] = ['TODO', 'ONGOING', 'DONE'];

function isMember(listId: string, userId: string) {
  const db = getDB();
  const list = db.lists.find(l => l.id === listId);
  return !!list && list.members.includes(userId);
}

router.use((req, res, next) => authMiddleware(req as Request & { user?: JwtPayload }, res, next));

router.get('/:listId', (req: Request & { user?: JwtPayload }, res: Response) => {
  const { listId } = req.params as { listId: string };
  const userId = req.user!.id;
  if (!isMember(listId, userId)) return res.status(403).json({ error: 'Forbidden' });
  const db = getDB();
  const todos = db.todos.filter(t => t.listId === listId);
  res.json(todos);
});

router.post('/:listId', (req: Request & { user?: JwtPayload }, res: Response) => {
  const { listId } = req.params as { listId: string };
  const { title } = (req.body || {}) as { title?: string };
  const userId = req.user!.id;
  if (!title) return res.status(400).json({ error: 'Title required' });
  if (!isMember(listId, userId)) return res.status(403).json({ error: 'Forbidden' });
  const id = newId();
  const now = new Date().toISOString();
  const todo: Todo = { id, listId, title, state: 'TODO', createdBy: userId, updatedAt: now };
  saveDB((data) => {
    data.todos.push(todo);
    return data;
  });
  broadcast(listId, 'todoCreated', { todo });
  res.status(201).json(todo);
});

router.post('/:listId/:todoId/transition', (req: Request & { user?: JwtPayload }, res: Response) => {
  const { listId, todoId } = req.params as { listId: string; todoId: string };
  const { direction } = (req.body || {}) as { direction?: 'forward' | 'back' };
  const userId = req.user!.id;
  if (!isMember(listId, userId)) return res.status(403).json({ error: 'Forbidden' });
  if (!direction || !['forward', 'back'].includes(direction)) return res.status(400).json({ error: 'Invalid direction' });

  let updated: Todo | undefined;
  try {
    saveDB((data) => {
      const todo = data.todos.find(t => t.id === todoId && t.listId === listId);
      if (!todo) throw new Error('NotFound');
      const idx = STATES.indexOf(todo.state);
      const nextIdx = direction === 'forward' ? Math.min(idx + 1, STATES.length - 1) : Math.max(idx - 1, 0);
      if (nextIdx === idx) throw new Error('NoTransition');
      todo.state = STATES[nextIdx];
      todo.updatedAt = new Date().toISOString();
      updated = { ...todo };
      return data;
    });
  } catch (e: any) {
    if (e.message === 'NotFound') return res.status(404).json({ error: 'Todo not found' });
    if (e.message === 'NoTransition') return res.status(400).json({ error: 'No valid transition' });
    return res.status(500).json({ error: 'Server error' });
  }

  if (!updated) return res.status(404).json({ error: 'Todo not found' });
  broadcast(listId, 'todoUpdated', { todo: updated });
  res.json(updated);
});

router.delete('/:listId/:todoId', (req: Request & { user?: JwtPayload }, res: Response) => {
  const { listId, todoId } = req.params as { listId: string; todoId: string };
  const userId = req.user!.id;
  if (!isMember(listId, userId)) return res.status(403).json({ error: 'Forbidden' });

  let removed = false;
  saveDB((data) => {
    const idx = data.todos.findIndex(t => t.id === todoId && t.listId === listId);
    if (idx === -1) return data;
    data.todos.splice(idx, 1);
    removed = true;
    return data;
  });

  if (!removed) return res.status(404).json({ error: 'Todo not found' });
  broadcast(listId, 'todoDeleted', { todoId });
  res.status(204).send();
});

export default router;
