import { Router, Request, Response } from 'express';
import { newId } from '../helpers/id-generator-helper';
import { authMiddleware, JwtPayload } from '../auth';
import type { Services } from '../di/container';
import { TodoItem, TodoItemState, TodoItemStateTransition } from '../models/todo-item';
import type { Router as ExpressRouter } from 'express';
import type {
    GetTodosResponse,
    CreateTodoRequestBody,
    CreateTodoResponse,
    TransitionRequestBody,
    TransitionResponse,
    DeleteTodoResponse,
} from '../models/http/todos';

export default function createTodosRouter(services: Services): ExpressRouter {
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

    function isMember(listId: string, userId: string, services: Services): boolean {
        const db = services.storage.getDB();
        const list = db.lists.find(l => l.id === listId);
        return !!list && list.members.includes(userId);
    }

    router.use((req, res, next): void => {
        authMiddleware(req as Request & { user?: JwtPayload }, res, next);
    });

    router.get('/:listId', (req: Request & { user?: JwtPayload }, res: Response<GetTodosResponse>): Response => {
        const { listId } = req.params;
        const userId = req.user!.id;
        if (!isMember(listId, userId, services)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const db = services.storage.getDB();
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
        if (!isMember(listId, userId, services)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const id = newId();
        const now = new Date().toISOString();
        const todo: TodoItem = { id, listId, title, state: TodoItemState.ToDo, createdBy: userId, updatedAt: now };
        services.storage.saveDB((data) => {
            data.todos.push(todo);
            return data;
        });
        services.sse.broadcast(listId, 'todoCreated', { todo });
        return res.status(201).json(todo);
    });

    router.post('/:listId/:todoId/transition', (req: Request & { user?: JwtPayload }, res: Response<TransitionResponse>): Response => {
        const { listId, todoId } = req.params;
        const { direction } = (req.body || {}) as TransitionRequestBody;
        const userId = req.user!.id;
        if (!isMember(listId, userId, services)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        if (!direction || !['forward', 'back'].includes(direction)) {
            return res.status(400).json({ error: 'Invalid direction' });
        }

        let updated: TodoItem | undefined;
        try {
            services.storage.saveDB((data) => {
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
            // eslint-disable-next-line no-console
            console.error('[TodosRouter] transition error:', message);
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
        services.sse.broadcast(listId, 'todoUpdated', { todo: updated });
        return res.json(updated);
    });

    router.delete('/:listId/:todoId', (req: Request & { user?: JwtPayload }, res: Response<DeleteTodoResponse>): Response => {
        const { listId, todoId } = req.params;
        const userId = req.user!.id;
        if (!isMember(listId, userId, services)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        let removed = false;
        services.storage.saveDB((data) => {
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
        services.sse.broadcast(listId, 'todoDeleted', { todoId });
        return res.status(204).send();
    });

    return router;
}
