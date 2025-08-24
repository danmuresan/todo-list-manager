import { Router, Request, Response } from 'express';
import { newId, newKey } from '../helpers/id-generator-helper';
import { authMiddleware, JwtPayload } from '../auth';
import type { Services } from '../di/container';
import type { CreateListRequestPayload, CreateListResponse, JoinListRequestPayload, JoinListResponse, GetListsResponse } from '../models/http/lists';

export default function createListsRouter(services: Services): ReturnType<typeof Router> {
    const router = Router();

    // Attach auth middleware for all list routes
    router.use((req, res, next): void => {
        authMiddleware(req as Request & { user?: JwtPayload }, res, next);
    });

    router.post('/', (req: Request & { user?: JwtPayload }, res: Response<CreateListResponse>): Response => {
        const { name } = (req.body || {}) as CreateListRequestPayload;
        if (!name) {
            return res.status(400).json({ error: 'Name required' });
        }
        const id = newId();
        const key = newKey(10);
        const userId = req.user!.id;
        const list = { id, name, key, members: [userId] };
        services.storage.saveDB((data) => {
            data.lists.push(list);
            return data;
        });
        services.sse.broadcast(list.id, 'listCreated', { list });
        return res.status(201).json(list);
    });

    router.post('/join', (req: Request & { user?: JwtPayload }, res: Response<JoinListResponse>): Response => {
        const { key } = (req.body || {}) as JoinListRequestPayload;
        const userId = req.user!.id;
        const db = services.storage.getDB();
        const list = db.lists.find(l => l.key === key);
        if (!list) {
            return res.status(404).json({ error: 'List not found' });
        }
        services.storage.saveDB((data) => {
            const l = data.lists.find(ll => ll.id === list.id)!;
            if (!l.members.includes(userId)) {
                l.members.push(userId);
            }
            return data;
        });
        services.sse.broadcast(list.id, 'memberJoined', { userId });
        return res.json({ id: list.id, name: list.name, key: list.key });
    });

    router.get('/', (req: Request & { user?: JwtPayload }, res: Response<GetListsResponse>): Response => {
        const userId = req.user!.id;
        const db = services.storage.getDB();
        const lists = db.lists.filter(l => l.members.includes(userId));
        return res.json(lists);
    });

    router.get('/:listId/stream', (req: Request & { user?: JwtPayload }, res: Response): Response | void => {
        const { listId } = req.params as { listId: string };
        const userId = req.user!.id;
        const db = services.storage.getDB();
        const list = db.lists.find(l => l.id === listId);
        if (!list) {
            return res.status(404).json({ error: 'List not found' });
        }
        if (!list.members.includes(userId)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        const maybeFlusher = res as Partial<{ flushHeaders: () => void }>;
        maybeFlusher.flushHeaders?.();

        services.sse.subscribe(listId, res);
        return undefined;
    });

    return router;
}
