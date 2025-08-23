import jwt from 'jsonwebtoken';
import { newId } from './ids';
import { getDB, saveDB } from './storage';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export type JwtPayload = { id: string; username: string };

export function generateToken(payload: JwtPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function authMiddleware(req: Request & { user?: JwtPayload }, res: Response, next: NextFunction) {
  const auth = req.headers.authorization || '';
  let token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  // Fallback for SSE/EventSource which cannot set headers: allow token as query param
  const query = req.query as { token?: string };
  if (!token && typeof query.token === 'string') {
    token = query.token;
  }
  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function registerUser(username: string) {
  if (!username || typeof username !== 'string') {
    throw new Error('Invalid username');
  }
  const id = newId();
  const token = generateToken({ id, username });
  saveDB((data) => {
    if (data.users.find(u => u.username === username)) {
      throw new Error('User exists');
    }
    data.users.push({ id, username, token });
    return data;
  });
  return { id, username, token };
}

export function authorizeUser(username: string) {
  const db = getDB();
  const user = db.users.find(u => u.username === username);
  if (!user) {
    return null;
  }
  const token = generateToken({ id: user.id, username: user.username });
  saveDB((data) => {
    const u = data.users.find(uu => uu.id === user.id);
    if (u) {
      u.token = token;
    }
    return data;
  });
  return { id: user.id, username: user.username, token };
}
