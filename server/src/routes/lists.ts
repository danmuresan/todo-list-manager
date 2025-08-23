import { Router, Request, Response } from 'express';
import { newId, newKey } from '../ids';
import { authMiddleware, JwtPayload } from '../auth';
import { getDB, saveDB } from '../storage';
import { broadcast, subscribe } from '../sse';

const router = Router();

// Attach auth middleware for all list routes
router.use((req, res, next) => authMiddleware(req as Request & { user?: JwtPayload }, res, next));

router.post('/', (req: Request & { user?: JwtPayload }, res: Response) => {
  const { name } = (req.body || {}) as { name?: string };
  if (!name) return res.status(400).json({ error: 'Name required' });
  const id = newId();
  const key = newKey(10);
  const userId = req.user!.id;
  const list = { id, name, key, members: [userId] };
  saveDB((data) => {
    data.lists.push(list);
    return data;
  });
  broadcast(list.id, 'listCreated', { list });
  res.status(201).json(list);
});

router.post('/join', (req: Request & { user?: JwtPayload }, res: Response) => {
  const { key } = (req.body || {}) as { key?: string };
  const userId = req.user!.id;
  const db = getDB();
  const list = db.lists.find(l => l.key === key);
  if (!list) return res.status(404).json({ error: 'List not found' });
  saveDB((data) => {
    const l = data.lists.find(ll => ll.id === list.id)!;
    if (!l.members.includes(userId)) l.members.push(userId);
    return data;
  });
  broadcast(list.id, 'memberJoined', { userId });
  res.json({ id: list.id, name: list.name, key: list.key });
});

router.get('/', (req: Request & { user?: JwtPayload }, res: Response) => {
  const userId = req.user!.id;
  const db = getDB();
  const lists = db.lists.filter(l => l.members.includes(userId));
  res.json(lists);
});

router.get('/:listId/stream', (req: Request & { user?: JwtPayload }, res: Response) => {
  const { listId } = req.params as { listId: string };
  const userId = req.user!.id;
  const db = getDB();
  const list = db.lists.find(l => l.id === listId);
  if (!list) return res.status(404).json({ error: 'List not found' });
  if (!list.members.includes(userId)) return res.status(403).json({ error: 'Forbidden' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  // @ts-ignore flushHeaders may not exist on minimal Response type
  (res as any).flushHeaders?.();

  subscribe(listId, res);
});

export default router;
