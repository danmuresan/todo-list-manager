import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDefaultConfig } from '../app-configs';
import { getHeaders } from '../../utils/header-utils';
import ErrorAlert from '../components/ErrorAlert';
import type { TodoItem, TodoList } from '../models/models';
import { getCachedAuthToken } from '../../utils/auth-utils';
import { localize } from '../../localization/localizer';

const {
    host,
    todoItemEndpoint,
    todoListsEndpoint,
    todoListUpdatesListenerEndpoint,
} = getDefaultConfig().todoListService;

/**
 * Todo item UI component
 */
export default function TodoItemView() {
    const { listId, todoId } = useParams();
    const [list, setList] = useState<TodoList | null>(null);
    const [todo, setTodo] = useState<TodoItem | null>(null);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const cachedAuthToken = useMemo(() => getCachedAuthToken(), []);

    const stateLabel = (state: TodoItem['state']) => {
        switch (state) {
            case 'TODO':
                return localize('todo.state.todo');
            case 'ONGOING':
                return localize('todo.state.ongoing');
            case 'DONE':
                return localize('todo.state.done');
            default:
                return state;
        }
    };

    useEffect(() => {
        if (!cachedAuthToken) {
            return navigate('/');
        }
        (async () => {
            try {
                if (!listId || !todoId) {
                    return;
                }

                const allTodoLists: TodoList[] = await fetch(
                    `${host}${todoListsEndpoint}`,
                    getHeaders(cachedAuthToken)
                ).then(response => response.json());

                const matchingTodoList = allTodoLists.find(x => x.id === listId);
                if (!matchingTodoList) {
                    navigate('/lists');
                    return;
                }

                setList(matchingTodoList);

                const initialTodos: TodoItem[] = await fetch(
                    `${host}${todoItemEndpoint(matchingTodoList.id)}`,
                    getHeaders(cachedAuthToken)
                ).then(r => r.json());

                setTodo(initialTodos.find(t => t.id === todoId) || null);
            } catch (e: any) {
                setError(e?.message || localize('errors.failedLoadTodo'));
            }
        })();
    }, [listId, todoId, navigate, cachedAuthToken]);

    useEffect(() => {
        if (!list || !cachedAuthToken) {
            return;
        }

        const eventSource = new EventSource(`${host}${todoListUpdatesListenerEndpoint(list.id, cachedAuthToken)}`);
        
        const onAnyListChange = async () => {
            try {
                const todoItems: TodoItem[] = await fetch(
                    `${host}${todoItemEndpoint(list.id)}`,
                    getHeaders(cachedAuthToken)
                ).then(response => response.json());

                if (todo?.id) {
                    const match = todoItems.find(todoItem => todoItem.id === todo.id) || null;
                    setTodo(match);
                    if (!match) {
                        navigate(`/home/${list.id}`);
                    }
                }
            } catch (e: any) {
                setError(e?.message || localize('errors.failedRefreshTodo'));
            }
        };

    const onError = () => setError(localize('errors.realtimeLost'));
        eventSource.addEventListener('todoUpdated', onAnyListChange);
        eventSource.addEventListener('todoCreated', onAnyListChange);
        eventSource.addEventListener('todoDeleted', onAnyListChange);
        eventSource.addEventListener('error', onError as EventListener);

        return () => eventSource.close();
    }, [list, cachedAuthToken, todo?.id, navigate]);

    const transitionStateForTodoItem = useCallback(async (transitionItem: 'next' | 'previous') => {
        if (!list || !todo || !cachedAuthToken) {
            return;
        }

        try {
            await fetch(`${host}${todoItemEndpoint(list.id, todo.id, true)}`, {
                method: 'POST',
                ...getHeaders(cachedAuthToken,'application/json'),
                body: JSON.stringify({ transitionItem })
            });
        } catch (e: any) {
            setError(e?.message || localize('errors.failedUpdateTodo'));
        }
    }, [list?.id, todo?.id, cachedAuthToken]);

    const deleteTodoItem = useCallback(async () => {
        if (!list || !todo || !cachedAuthToken) {
            return;
        }

        try {
            await fetch(
                `${host}${todoItemEndpoint(list.id, todo.id)}`,
                { 
                    method: 'DELETE',
                    ...getHeaders(cachedAuthToken)
                });
            navigate(`/home/${list.id}`);
        } catch (e: any) {
            setError(e?.message || localize('errors.failedDeleteTodo'));
        }
    }, [list?.id, todo?.id, cachedAuthToken, navigate]);


    const handleBack = useCallback(() => {
        navigate(list ? `/home/${list.id}` : '/lists');
    }, [navigate, list?.id]);

    const handleUpdateTodoItemToPreviousState = useCallback(() => transitionStateForTodoItem('previous'), [transitionStateForTodoItem]);
    const handleUpdateTodoItemToNextState = useCallback(() => transitionStateForTodoItem('next'), [transitionStateForTodoItem]);
    const handleDismissError = useCallback(() => setError(null), []);

    const styles = {
        container: { padding: 16, maxWidth: 700, margin: '0 auto', fontFamily: 'system-ui' },
        loading: { padding: 16 },
        title: { fontSize: 20 },
        actions: { display: 'flex', gap: 8 }
    } as const;

    if (!todo) {
        return <div style={styles.loading}>{localize('todoItem.loading')}</div>;
    }

    return (
        <div style={styles.container}>
            <button onClick={handleBack}>{localize('todoItem.back')}</button>
            <h1 style={styles.title}>{todo.title}</h1>
            {error && (
                <ErrorAlert message={error!} onDismiss={handleDismissError} />
            )}
            <p>{localize('todoItem.state.label')} <strong>{stateLabel(todo.state)}</strong></p>
            <div style={styles.actions}>
                {todo.state !== 'TODO' && (
                    <button onClick={handleUpdateTodoItemToPreviousState}>
                        {todo.state === 'DONE' ? localize('todo.transition.inProgress') : localize('todo.transition.toBeDone')}
                    </button>
                )}
                {todo.state !== 'DONE' && (
                    <button onClick={handleUpdateTodoItemToNextState}>
                        {todo.state === 'TODO' ? localize('todo.transition.inProgress') : localize('todo.transition.markDone')}
                    </button>
                )}
                <button onClick={deleteTodoItem}>{localize('todo.delete')}</button>
            </div>
        </div>
    );
}
