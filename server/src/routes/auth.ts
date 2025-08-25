import { Router, Request, Response } from 'express';
import type { AppDependencies } from '../di/di-container';
import { newId } from '../helpers/id-generator-helper';
import { generateAuthToken } from '../auth';
import type { RegisterRequestPayload, RegisterResponse, AuthorizeRequestPayload, AuthorizeResponse } from '../models/http/auth';

/**
 * Creates routes for managing auth.
 * @param deps service dependencies.
 */
export default function createAuthRouter(deps: AppDependencies): ReturnType<typeof Router> {
    const router = Router();

    router.post('/register', (req: Request, res: Response<RegisterResponse>): Response => {
        const { username } = (req.body || {}) as RegisterRequestPayload;
        try {
            if (!username || typeof username !== 'string') {
                throw new Error('Invalid username');
            }
            const id = newId();
            const token = generateAuthToken({ id, username });
            deps.storage.updateStorageData((data) => {
                if (data.users.find(u => u.username === username)) {
                    throw new Error('User exists');
                }
                data.users.push({ id, username, token });
                return data;
            });
            const user = { id, username, token };
            return res.json(user);
        } catch (e) {
            const err = e as Error;
            deps.logger.error?.('[AuthRouter] register error:', err.message);
            if (err.message === 'User exists') {
                return res.status(409).json({ error: 'User exists' });
            }
            return res.status(400).json({ error: err.message || 'Bad Request' });
        }
    });

    router.post('/authorize', (req: Request, res: Response<AuthorizeResponse>): Response => {
        const { username } = (req.body || {}) as AuthorizeRequestPayload;
        const db = deps.storage.getStorageData();
        const user = db.users.find(u => u.username === username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = generateAuthToken({ id: user.id, username: user.username });
        deps.storage.updateStorageData((data) => {
            const u = data.users.find(uu => uu.id === user.id);
            if (u) {
                u.token = token;
            }
            return data;
        });
        return res.json({ id: user.id, username: user.username, token });
    });

    return router;
}
