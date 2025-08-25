import { Router, Request, Response } from 'express';
import type { AppDependencies } from '../di/di-container';
import { newId } from '../helpers/id-generator-helper';
import { generateAuthToken } from '../auth';
import type { RegisterRequestPayload, RegisterResponse, AuthorizeRequestPayload, AuthorizeResponse } from '../models/api/auth';
import { AUTH_ROUTES } from './route-paths';
import type { User } from '../models/user';

/**
 * Creates routes for managing auth.
 * @param deps service dependencies.
 */
export default function createAuthRouter(deps: AppDependencies): ReturnType<typeof Router> {
    const router = Router();

    router.post(AUTH_ROUTES.register, (req: Request, res: Response<RegisterResponse>): Response => {
        const { username } = (req.body || {}) as RegisterRequestPayload;
        
		try {
            if (!username || typeof username !== 'string') {
                throw new Error('Invalid username');
            }

            const id = newId();
            const token = generateAuthToken({ id, username });

            // Ensure username uniqueness
            const existing = deps.usersRepo.getAll().find(u => u.username === username);
            if (existing) {
                throw new Error('User exists');
            }

            const user: User = { id, username, token };
            deps.usersRepo.add(user);
			
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

    router.post(AUTH_ROUTES.authorize, (req: Request, res: Response<AuthorizeResponse>): Response => {
        const { username } = (req.body || {}) as AuthorizeRequestPayload;
        const user = deps.usersRepo.getAll().find(u => u.username === username);

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateAuthToken({ id: user.id, username: user.username });
        deps.usersRepo.update((u) => {
            if (u.id === user.id) {
                u.token = token;
            }
        });

        return res.json({ id: user.id, username: user.username, token });
    });

    return router;
}
