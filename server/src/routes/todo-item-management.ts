import { Router, Request, Response } from 'express';
import { newId } from '../helpers/id-generator-helper';
import { createAuthMiddleware, JwtPayload } from '../auth';
import type { AppDependencies } from '../di/di-container';
import { TodoItem, TodoItemState, TodoItemStateTransition } from '../models/todo-item';
import type { Router as ExpressRouter } from 'express';
import { logger } from '../services/logger';
import type {
    GetTodosResponse,
    CreateTodoRequestBody,
    CreateTodoResponse,
    TransitionRequestBody,
    TransitionResponse,
    DeleteTodoResponse,
} from '../models/http/todos';

/**
 * Creates routes for managing todo items.
 * @param deps service dependencies.
 */
export default function createTodoItemRouter(deps: AppDependencies): ExpressRouter {
    const router = Router();

    /**
	 * Type-safe transition table between todo states.
	 * - forward: next state when moving forward
	 * - back: previous state when moving back
	 */
    const TRANSITIONS: Readonly<Record<TodoItemState, TodoItemStateTransition>> = {
        [TodoItemState.ToDo]: { nextState: TodoItemState.Ongoing },
        [TodoItemState.Ongoing]: { nextState: TodoItemState.Done, previousState: TodoItemState.ToDo },
        [TodoItemState.Done]: { previousState: TodoItemState.Ongoing },
    } as const;

    function transitionState(state: TodoItemState, direction: 'forward' | 'back'): TodoItemState | null {
        const rules = TRANSITIONS[state];
        return direction === 'forward' ? rules.nextState ?? null : rules.previousState ?? null;
    }

    function isMember(listId: string, userId: string, services: AppDependencies): boolean {
        const db = services.storage.getStorageData();
        const list = db.lists.find(l => l.id === listId);
        return !!list && list.members.includes(userId);
    }

    const auth = createAuthMiddleware(deps.logger);
    router.use((req, res, next): void => {
        auth(req as Request & { user?: JwtPayload }, res, next);
    });

    router.get('/:listId', (req: Request & { user?: JwtPayload }, res: Response<GetTodosResponse>): Response => {
        const { listId } = req.params;
        const userId = req.user!.id;
        if (!isMember(listId, userId, deps)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const db = deps.storage.getStorageData();
        const todos = db.todos.filter(t => t.listId === listId);
        return res.json(todos);
    });

    router.post('/:listId', (req: Request & { user?: JwtPayload }, res: Response<CreateTodoResponse>): Response => {
        const { listId } = req.params;
        const { title } = (req.body || {}) as CreateTodoRequestBody;
        const userId = req.user!.id;
        if (!title) {
            return res.status(400).json({ error: 'Title required' });
        }
        if (!isMember(listId, userId, deps)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const id = newId();
        const now = new Date().toISOString();
        const todo: TodoItem = { id, listId, title, state: TodoItemState.ToDo, createdBy: userId, updatedAt: now };
        deps.storage.updateStorageData((data) => {
            data.todos.push(todo);
            return data;
        });
        deps.sse.broadcast(listId, 'todoCreated', { todo });
        return res.status(201).json(todo);
    });

    router.post('/:listId/:todoId/transition', (req: Request & { user?: JwtPayload }, res: Response<TransitionResponse>): Response => {
        const { listId, todoId } = req.params;
        const { direction } = (req.body || {}) as TransitionRequestBody;
        const userId = req.user!.id;
        if (!isMember(listId, userId, deps)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        if (!direction || !['forward', 'back'].includes(direction)) {
            return res.status(400).json({ error: 'Invalid direction' });
        }

        let updated: TodoItem | undefined;
        try {
            deps.storage.updateStorageData((data) => {
                const todo = data.todos.find(t => t.id === todoId && t.listId === listId);
                if (!todo) {
                    throw new Error('NotFound');
                }
                const next = transitionState(todo.state, direction);
                if (!next || next === todo.state) {
                    throw new Error('NoTransition');
                }
                todo.state = next;
                todo.updatedAt = new Date().toISOString();
                updated = { ...todo };
                return data;
            });
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            logger.error?.('[TodosRouter] transition error:', message);
            if (message === 'NotFound') {
                return res.status(404).json({ error: 'Todo not found' });
            }
            if (message === 'NoTransition') {
                return res.status(400).json({ error: 'No valid transition' });
            }
            return res.status(500).json({ error: 'Server error' });
        }

        if (!updated) {
            return res.status(404).json({ error: 'Todo not found' });
        }
        deps.sse.broadcast(listId, 'todoUpdated', { todo: updated });
        return res.json(updated);
    });

    router.delete('/:listId/:todoId', (req: Request & { user?: JwtPayload }, res: Response<DeleteTodoResponse>): Response => {
        const { listId, todoId } = req.params;
        const userId = req.user!.id;
        if (!isMember(listId, userId, deps)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        let removed = false;
        deps.storage.updateStorageData((data) => {
            const idx = data.todos.findIndex(t => t.id === todoId && t.listId === listId);
            if (idx === -1) {
                return data;
            }
            data.todos.splice(idx, 1);
            removed = true;
            return data;
        });

        if (!removed) {
            return res.status(404).json({ error: 'Todo not found' });
        }
        deps.sse.broadcast(listId, 'todoDeleted', { todoId });
        return res.status(204).send();
    });

    return router;
}
