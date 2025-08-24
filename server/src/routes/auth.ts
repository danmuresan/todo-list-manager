import { Router, Request, Response } from 'express';
import { authorizeUser, registerUser } from '../auth';
import type { RegisterRequestPayload, RegisterResponse, AuthorizeRequestPayload, AuthorizeResponse } from '../models/http/auth';

export default function createAuthRouter(): ReturnType<typeof Router> {
    const router = Router();

    router.post('/register', (req: Request, res: Response<RegisterResponse>): Response => {
        const { username } = (req.body || {}) as RegisterRequestPayload;
        try {
            const user = registerUser(username as string);
            return res.json(user);
        } catch (e) {
            const err = e as Error;
            // eslint-disable-next-line no-console
            console.error('[AuthRouter] register error:', err.message);
            if (err.message === 'User exists') {
                return res.status(409).json({ error: 'User exists' });
            }
            return res.status(400).json({ error: err.message || 'Bad Request' });
        }
    });

    router.post('/authorize', (req: Request, res: Response<AuthorizeResponse>): Response => {
        const { username } = (req.body || {}) as AuthorizeRequestPayload;
        const user = authorizeUser(username as string);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        return res.json(user);
    });

    return router;
}
