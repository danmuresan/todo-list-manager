import { Router, Response } from 'express';
import { newId, newKey } from '../helpers/id-generator-helper';
import { createAuthMiddleware } from '../auth';
import type { AppDependencies } from '../di/di-container';
import type { CreateTodoListRequestPayload, CreateTodoListResponse, JoinTodoListRequestPayload, JoinTodoListResponse, GetAllTodoListsResponse, GetTodoListStreamRequestParams } from '../models/api/todo-lists';
import type { AuthenticatedRequest, NoParams } from '../models/routes/authenticated-request';
import { TODO_LIST_ROUTES } from './route-paths';

/**
 * Creates routes for managing todo lists.
 * @param deps service dependencies.
 */
export default function createTodoListsManagementRouter(deps: AppDependencies): ReturnType<typeof Router> {
    const router = Router();
    const listsRepo = deps.todoListsRepo;

    // Attach auth middleware for all list routes
    const auth = createAuthMiddleware(deps.logger);
    router.use(auth);

    router.post(TODO_LIST_ROUTES.root, (req: AuthenticatedRequest<NoParams, CreateTodoListResponse, CreateTodoListRequestPayload>, res: Response<CreateTodoListResponse>): Response => {
        const { name } = (req.body || {});
        if (!name) {
            return res.status(400).json({ error: 'Name required' });
        }

        const id = newId();
        const key = newKey(10);
        const userId = req.user!.id;
        const list = { id, name, key, members: [userId] };

        listsRepo.add(list);
            deps.sse.broadcast(list.id, 'listCreated', { list });
            return res.status(201).json(list);
        });

        router.post(TODO_LIST_ROUTES.join, (req: AuthenticatedRequest<NoParams, JoinTodoListResponse, JoinTodoListRequestPayload>, res: Response<JoinTodoListResponse>): Response => {
        const { key } = (req.body || {});
        const userId = req.user!.id;
        const list = listsRepo.getAll().find(l => l.key === key);

        if (!list) {
            return res.status(404).json({ error: 'List not found' });
        }

        listsRepo.update(
            (matchedList) => {
                if (!matchedList.members.includes(userId)) {
                    matchedList.members.push(userId);
                }
            },
            (l) => l.id === list.id);

        deps.sse.broadcast(list.id, 'memberJoined', { userId });

        return res.json({ id: list.id, name: list.name, key: list.key });
    });

    router.get(TODO_LIST_ROUTES.root, (req: AuthenticatedRequest<NoParams, GetAllTodoListsResponse>, res: Response<GetAllTodoListsResponse>): Response => {
        const userId = req.user!.id;
        const lists = listsRepo.getAll().filter(l => l.members.includes(userId));
            return res.json(lists);
        });

        router.get(TODO_LIST_ROUTES.stream, (req: AuthenticatedRequest<GetTodoListStreamRequestParams>, res: Response): Response | void => {
            const { listId } = req.params;
            const userId = req.user!.id;
            const list = listsRepo.getById(listId);

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

            deps.sse.subscribe(listId, res);
            
            return undefined;
        });

    return router;
}
