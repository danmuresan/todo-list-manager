import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import type { ILogger } from './services/abstractions/logger-abstraction';
import type { JwtPayload } from './models/auth/jwt-payload';
export type { JwtPayload } from './models/auth/jwt-payload';

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
export function createAuthMiddleware(logger: ILogger) {
    return function authMiddleware(req: Request & { user?: JwtPayload }, res: Response, next: NextFunction): Response | void {
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
            logger.error?.('authMiddleware error:', (err as Error).message);
            return res.status(401).json({ error: 'Invalid token' });
        }
    };
}

/**
 * Helper to register new user.
 * @param username Username of user to register.
 * @returns User object.
 */
// NOTE: User registration/authorization logic moved into routes/auth to leverage full DI.
