import { Router, Request, Response } from 'express';
import { authorizeUser, registerUser } from '../auth';

const router = Router();

router.post('/register', (req: Request, res: Response) => {
  const { username } = (req.body || {}) as { username?: string };
  try {
    const user = registerUser(username as string);
    res.json(user);
  } catch (e: any) {
    if (e.message === 'User exists') return res.status(409).json({ error: 'User exists' });
    res.status(400).json({ error: e.message || 'Bad Request' });
  }
});

router.post('/authorize', (req: Request, res: Response) => {
  const { username } = (req.body || {}) as { username?: string };
  const user = authorizeUser(username as string);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  res.json(user);
});

export default router;
