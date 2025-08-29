import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDefaultConfig } from '../app-configs';
import { getHeaders } from '../../utils/header-utils';
import ErrorAlert from '../components/ErrorAlert';
import type { TodoItem, TodoList } from '../models/models';
import { getCachedAuthToken } from '../../utils/auth-utils';
import UserHeader from '../components/UserHeader';
import { writeTextToClipboard, buildInviteText } from '../../utils/clipboard-utils';
import { localize } from '../../localization/localizer';
import { COPIED_TO_CLIPBOARD_ALERT_TIMEOUT } from '../models/consts';
import { routes } from '../models/navigation-routes';
import { sseBroadcastEvents } from '../models/sse-broadcast-consts';

const {
    host,
    todoListsEndpoint,
    todoListUpdatesListenerEndpoint,
    todoItemEndpoint,
} = getDefaultConfig().todoListService;

const styles = {
    container: { padding: 16, maxWidth: 900, margin: '0 auto', fontFamily: 'system-ui' },
    addForm: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, margin: '16px 0', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8 },
    addInput: { flex: 1 },
    listRoot: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 },
    listItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8 },
    itemLabel: { cursor: 'pointer', flex: 1 },
    itemState: { opacity: 0.7, fontSize: 12 },
    itemActions: { display: 'flex', gap: 8, marginLeft: 12 },
    footerWrap: { position: 'sticky', bottom: 0, background: 'white', paddingTop: 12, marginTop: 16 },
    footer: { display: 'flex', alignItems: 'center', gap: 12 },
    copiedText: { color: 'green', marginLeft: 8 }
} as const;

export default function Home() {
    const [list, setList] = useState<TodoList | null>(null);
    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [title, setTitle] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const navigate = useNavigate();
    const { listId } = useParams();

    const stateLabel = useCallback((state: TodoItem['state']) => {
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
    }, []);

    const onReloadRequested = useCallback(async (payloadAsJson: string) => {
        try {
            const { todo } = JSON.parse(payloadAsJson);
            const { todoId: deleteTodoItemId } = JSON.parse(payloadAsJson);
            const wasDeleted = deleteTodoItemId !== undefined;
            setTodos((prevTodos) => {
                if (wasDeleted) {
                    return prevTodos.filter(t => t.id !== deleteTodoItemId);
                }

                if (!todo) {
                    return prevTodos;
                }
                
                const index = prevTodos.findIndex(t => t.id === todo.id);
                if (index !== -1) {
                    const newTodos = [...prevTodos];
                    newTodos[index] = todo;
                    return newTodos;
                } else {
                    return [...prevTodos, todo];
                }
            });
        } catch (e: any) {
            setError(e?.message || localize('errors.failedRefreshTodos'));
        }
    }, []);

    const onError = useCallback(() => setError(localize('errors.realtimeLost')), []);

    // After navigating to Home (post-login), ensure the main window is resized/widened
    useEffect(() => {
        setTimeout(() => (window as any).electronAPI?.loginWindowCompleted(), 0);
    }, []);

    // Initial load: validate access to list and fetch todos
    useEffect(() => {
        const token = getCachedAuthToken();

        if (!token) {
            navigate(routes.default);
            return;
        }

        // Require a listId in the route
        if (!listId) {
            navigate(routes.todoLists);
            return;
        }

        (async () => {
            try {
                const lists: TodoList[] = await fetch(
                    `${host}${todoListsEndpoint}`,
                    getHeaders(token)
                ).then((response) => response.json());

                // If listId param is missing, fall back to the first available list instead of navigating away
                const selected = (listId
                    ? lists.find((l) => l.id === listId) || null
                    : lists[0] || null);
                if (!selected) {
                    setError(localize('errors.notMemberOrMissing'));
                    navigate(routes.todoLists);
                    return;
                }

                setList(selected);

                const todoItemsFromList: TodoItem[] = await fetch(
                    `${host}${todoItemEndpoint(selected.id)}`,
                    getHeaders(token)
                ).then((response) => response.json());

                setTodos(todoItemsFromList);
            } catch (e: any) {
                setError(e?.message || localize('errors.failedLoadTodos'));
            }
        })();
    }, [navigate, listId]);

    // Realtime SSE subscription for the current list
    useEffect(() => {
        if (!list) {
            return;
        }
        const token = getCachedAuthToken();
        if (!token) {
            return;
        }

        const eventSource = new EventSource(
            `${host}${todoListUpdatesListenerEndpoint(list.id, token)}`
        );
        
        eventSource.addEventListener(sseBroadcastEvents.TODO_CREATED, (event) => onReloadRequested(event.data));
        eventSource.addEventListener(sseBroadcastEvents.TODO_UPDATED, (event) => onReloadRequested(event.data));
        eventSource.addEventListener(sseBroadcastEvents.TODO_DELETED, (event) => onReloadRequested(event.data));
        eventSource.addEventListener('error', onError as EventListener);
        return () => eventSource.close();
    }, [list]);

    const authToken = useMemo(() => getCachedAuthToken(), [list]);

    const addTodoItem = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!list || !authToken || !title.trim()) return;

        try {
            await fetch(`${host}${todoItemEndpoint(list.id)}`, {
                method: 'POST',
                ...getHeaders(authToken, 'application/json'),
                body: JSON.stringify({ title }),
            });
            setTitle('');
        } catch (e: any) {
            setError(e?.message || localize('errors.failedAddTodo'));
        }
    }, [list?.id, authToken, title]);

    const deleteTodoItem = useCallback(async (todoItem: TodoItem) => {
        if (!list || !authToken) {
            return;
        }
        try {
            await fetch(`${host}${todoItemEndpoint(list.id, todoItem.id)}`, {
                method: 'DELETE',
                ...getHeaders(authToken),
            });
        } catch (e: any) {
            setError(e?.message || localize('errors.failedDeleteTodo'));
        }
    }, [list?.id, authToken]);

    const transition = useCallback(async (todoItem: TodoItem, transitionItem: 'next' | 'previous') => {
        if (!list || !authToken) {
            return;
        }
        try {
            await fetch(`${host}${todoItemEndpoint(list.id, todoItem.id, true)}`,
                {
                    method: 'POST',
                    ...getHeaders(authToken, 'application/json'),
                    body: JSON.stringify({ transitionItem }),
                }
            );
        } catch (e: any) {
            setError(e?.message || localize('errors.failedUpdateTodo'));
        }
    }, [list?.id, authToken]);

    const copyInviteLink = useCallback(async () => {
        if (!list) {
            return;
        }

        const text = buildInviteText(
            list.name,
            list.key,
            `${host}${todoListsEndpoint}/join`
        );
        
        const ok = writeTextToClipboard(text);
        if (ok) {
            setCopied(true);
            setTimeout(() => setCopied(false), COPIED_TO_CLIPBOARD_ALERT_TIMEOUT);
        } else {
            setError(localize('errors.clipboardUnavailable'));
        }
    }, [list?.name, list?.key]);

    const openLists = useCallback(() => navigate(routes.todoLists), [navigate]);

    const handleOpenTodo = useCallback(
        (todoId: string) => () => {
            if (!list?.id) return;
            navigate(routes.todoItem(list.id, todoId));
        },
        [navigate, list?.id]
    );

    const handleTransitionPrev = useCallback(
        (item: TodoItem) => () => transition(item, 'previous'),
        [transition]
    );

    const handleTransitionNext = useCallback(
        (item: TodoItem) => () => transition(item, 'next'),
        [transition]
    );

    const handleDeleteItem = useCallback(
        (item: TodoItem) => () => deleteTodoItem(item),
        [deleteTodoItem]
    );

    const dismissError = useCallback(() => setError(null), []);

    return (
        <div style={styles.container}>
            <UserHeader title={list ? `${list.name} – ${localize('app.title.todos')}` : localize('app.title.todos')} />
            {error && <ErrorAlert message={error} onDismiss={dismissError} />}

            <form
                onSubmit={addTodoItem}
                style={styles.addForm}
            >
                <input
                    placeholder={localize('home.newTodo.placeholder')}
                    value={title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                    style={styles.addInput}
                    required
                />
                <button type="submit">{localize('home.add')}</button>
            </form>

            <ul style={styles.listRoot}>
                {todos.map((item: TodoItem) => (
                    <li
                        key={item.id}
                        style={styles.listItem}
                    >
                        <span style={styles.itemLabel} onClick={handleOpenTodo(item.id)}>
                            {item.title} <span style={styles.itemState}>[{stateLabel(item.state)}]</span>
                        </span>
                        <span style={styles.itemActions}>
                            {item.state !== 'TODO' && (
                                <button onClick={handleTransitionPrev(item)}>
                                    {item.state === 'DONE' ? localize('todo.transition.inProgress') : localize('todo.transition.toBeDone')}
                                </button>
                            )}
                            {item.state !== 'DONE' && (
                                <button onClick={handleTransitionNext(item)}>
                                    {item.state === 'TODO' ? localize('todo.transition.inProgress') : localize('todo.transition.markDone')}
                                </button>
                            )}
                            <button onClick={handleDeleteItem(item)}>{localize('todo.delete')}</button>
                        </span>
                    </li>
                ))}
            </ul>

            <div style={styles.footerWrap}>
                <div style={styles.footer}
                >
                    <button onClick={openLists}>{localize('home.joinDifferent')}</button>
                    <button onClick={copyInviteLink} disabled={!list}>{localize('home.copyInviteKey')}</button>
                    {copied && <span style={styles.copiedText}>{localize('home.copied')}</span>}
                </div>
            </div>
        </div>
    );
}
