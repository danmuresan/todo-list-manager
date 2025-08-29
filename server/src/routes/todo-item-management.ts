import { Router, Response } from 'express';
import { newId } from '../helpers/id-generator-helper';
import { createAuthMiddleware } from '../auth';
import type { AppDependencies } from '../di/di-container';
import { TodoItem, TodoItemState, TodoItemStateTransition } from '../models/todo-item';
import type { Router as ExpressRouter } from 'express';
import { logger } from '../services/logger';
import type {
    GetTodosResponse,
    GetTodoItemsRequestParams,
    CreateTodoItemRequestPayload,
    CreateTodoResponse,
    TransitionTodoItemStateRequestParams,
    TransitionTodoItemStateRequestPayload,
    TransitionTodoItemResponse,
    DeleteTodoItemRequestParams,
    DeleteTodoResponse,
} from '../models/api/todo-items';
import { TODO_ITEM_ROUTES } from './route-paths';
import type { AuthenticatedRequest } from '../models/routes/authenticated-request';
import { sseBroadcastPaths } from './sse-broadcast-paths';

/**
 * Creates routes for managing todo items.
 * @param deps service dependencies.
 */
export default function createTodoItemManagementRouter(deps: AppDependencies): ExpressRouter {
    const router = Router();

    /**
     * Type-safe transition table between todo states.
     * - next: move to the next state
     * - previous: move to the previous state
     */
    const TRANSITIONS: Readonly<Record<TodoItemState, TodoItemStateTransition>> = {
        [TodoItemState.ToDo]: { nextState: TodoItemState.Ongoing },
        [TodoItemState.Ongoing]: { nextState: TodoItemState.Done, previousState: TodoItemState.ToDo },
        [TodoItemState.Done]: { previousState: TodoItemState.Ongoing },
    } as const;

    function transitionState(state: TodoItemState, transitionItem: 'next' | 'previous'): TodoItemState | null {
        const rules = TRANSITIONS[state];
        return transitionItem === 'next' ? rules.nextState ?? null : rules.previousState ?? null;
    }

    function isMember(listId: string, userId: string, services: AppDependencies): boolean {
        const list = services.todoListsRepo.getById(listId);
        return !!list && list.members.includes(userId);
    }

    const auth = createAuthMiddleware(deps.logger);
    router.use(auth);

    router.get(TODO_ITEM_ROUTES.byList, (req: AuthenticatedRequest<GetTodoItemsRequestParams, GetTodosResponse>, res: Response<GetTodosResponse>): Response => {
        const { listId } = req.params;
        const userId = req.user!.id;

        if (!isMember(listId, userId, deps)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const todos = deps.todoItemsRepo.getAll().filter(t => t.listId === listId);

        return res.json(todos);
    });

    router.post(TODO_ITEM_ROUTES.create, (req: AuthenticatedRequest<GetTodoItemsRequestParams, CreateTodoResponse, CreateTodoItemRequestPayload>, res: Response<CreateTodoResponse>): Response => {
        const { listId } = req.params;
        const { title } = (req.body || {});
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
        
        deps.todoItemsRepo.add(todo);

        deps.sse.broadcast(listId, sseBroadcastPaths.TODO_CREATED, { todo });

        return res.status(201).json(todo);
    });

    router.post(TODO_ITEM_ROUTES.transition, (req: AuthenticatedRequest<TransitionTodoItemStateRequestParams, TransitionTodoItemResponse, TransitionTodoItemStateRequestPayload>, res: Response<TransitionTodoItemResponse>): Response => {
        const { listId, todoId } = req.params;
        const { transitionItem } = (req.body || {});
        const userId = req.user!.id;

        if (!isMember(listId, userId, deps)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        if (!transitionItem || !['next', 'previous'].includes(transitionItem)) {
            return res.status(400).json({ error: 'Invalid transition' });
        }

        let updated: TodoItem | undefined;
        try {
            let todoItemExists = false;
            deps.todoItemsRepo.update(
                (todoItem) => {
                    if (todoItem.id !== todoId || todoItem.listId !== listId) {
                        return;
                    }

                    todoItemExists = true;
                    const next = transitionState(todoItem.state, transitionItem);
                    
                    if (!next || next === todoItem.state) {
                        throw new Error('NoTransition');
                    }

                    todoItem.state = next;
                    todoItem.updatedAt = new Date().toISOString();
                    updated = { ...todoItem };
                },
                (todoItem) => todoItem.id === todoId && todoItem.listId === listId);
                
            if (!todoItemExists) {
                throw new Error('NotFound');
            }
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

    router.delete(TODO_ITEM_ROUTES.delete, (req: AuthenticatedRequest<DeleteTodoItemRequestParams, DeleteTodoResponse>, res: Response<DeleteTodoResponse>): Response => {
        const { listId, todoId } = req.params;
        const userId = req.user!.id;

        if (!isMember(listId, userId, deps)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const removed = deps.todoItemsRepo.removeById(todoId);

        if (!removed) {
            return res.status(404).json({ error: 'Todo not found' });
        }

        deps.sse.broadcast(listId, 'todoDeleted', { todoId });

        return res.status(204).send();
    });

    return router;
}
