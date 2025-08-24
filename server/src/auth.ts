import jwt from 'jsonwebtoken';
import { newId } from './helpers/id-generator-helper';
import { storageService } from './services/storage-service';
import { Request, Response, NextFunction } from 'express';
import type { JwtPayload } from './models/auth/jwt';
export type { JwtPayload } from './models/auth/jwt';

const JWT_SECRET: string = process.env.JWT_SECRET || 'dev-secret';

// JwtPayload interface is declared in models/auth/jwt

/**
 * Generate auth token.
 * @param payload JWT token payload.
 * @returns JWT token string.
 */
export function generateAuthToken(payload: JwtPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Authentication middleware responsible for 
 * verifying JWT bearer auth tokens on each incoming request.
 * @param req Incoming HTTP request.
 * @param res Sets 401 forbidden on the HTTP response for the incoming request in case of missing or invalid token.
 * @param next Next middleware function.
 */
export function authMiddleware(req: Request & { user?: JwtPayload }, res: Response, next: NextFunction): Response | void {
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
        return next();
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('authMiddleware error:', (err as Error).message);
        return res.status(401).json({ error: 'Invalid token' });
    }
}

/**
 * Helper to register new user.
 * @param username Username of user to register.
 * @returns User object.
 */
export function registerUser(username: string): { id: string; username: string; token: string } {
    if (!username || typeof username !== 'string') {
        throw new Error('Invalid username');
    }
    const id = newId();
    const token = generateAuthToken({ id, username });
    storageService.saveDB((data) => {
        if (data.users.find(u => u.username === username)) {
            throw new Error('User exists');
        }
        data.users.push({ id, username, token });
        return data;
    });
    return { id, username, token };
}

/**
 * Authorize user by username.
 * @param username Username of user to authorize.
 * @returns User object or null if not found.
 */
export function authorizeUser(username: string): { id: string; username: string; token: string } | null {
    const db = storageService.getDB();
    const user = db.users.find(u => u.username === username);
    if (!user) {
        return null;
    }
    const token = generateAuthToken({ id: user.id, username: user.username });
    storageService.saveDB((data) => {
        const u = data.users.find(uu => uu.id === user.id);
        if (u) {
            u.token = token;
        }
        return data;
    });
    return { id: user.id, username: user.username, token };
}
