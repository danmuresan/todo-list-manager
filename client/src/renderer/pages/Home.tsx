import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDefaultConfig } from '../app-configs';
import { getHeaders } from '../../utils/header-utils';
import ErrorAlert from '../components/ErrorAlert';
import type { TodoItem, TodoList } from '../models/models';
import { getCachedAuthToken } from '../../utils/auth-utils';
import UserHeader from '../components/UserHeader';
import { writeTextToClipboard, buildInviteText } from '../../utils/clipboard-utils';
import { localize } from '../../localization/i18n';

const {
    host,
    todoListsEndpoint,
    todoListUpdatesListenerEndpoint,
    todoItemEndpoint,
} = getDefaultConfig().todoListService;

export default function Home() {
    const [list, setList] = useState<TodoList | null>(null);
    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [title, setTitle] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const navigate = useNavigate();
    const { listId } = useParams();

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

    // After navigating to Home (post-login), ensure the main window is resized/widened
    useEffect(() => {
        setTimeout(() => (window as any).electronAPI?.loginWindowCompleted(), 0);
    }, []);

    // Initial load: validate access to list and fetch todos
    useEffect(() => {
        const token = getCachedAuthToken();

        if (!token) {
            navigate('/');
            return;
        }

        // Enforce lists-first flow: require a listId in the route
        if (!listId) {
            navigate('/lists');
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
                    navigate('/lists');
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

        const onReloadRequested = async () => {
            try {
                const data = await fetch(
                    `${host}${todoItemEndpoint(list.id)}`,
                    getHeaders(token)
                ).then((response) => response.json());

                setTodos(data);
            } catch (e: any) {
                setError(e?.message || localize('errors.failedRefreshTodos'));
            }
        };

    const onError = () => setError(localize('errors.realtimeLost'));
        eventSource.addEventListener('todoCreated', onReloadRequested);
        eventSource.addEventListener('todoUpdated', onReloadRequested);
        eventSource.addEventListener('todoDeleted', onReloadRequested);
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
            setTimeout(() => setCopied(false), 2000);
        } else {
            setError(localize('errors.clipboardUnavailable'));
        }
    }, [list?.name, list?.key]);

    const openLists = useCallback(() => navigate('/lists'), [navigate]);

    const dismissError = useCallback(() => setError(null), []);

    return (
        <div style={{ padding: 16, maxWidth: 800, margin: '0 auto', fontFamily: 'system-ui' }}>
            <UserHeader title={list ? `${list.name} – ${localize('app.title.todos')}` : localize('app.title.todos')} />
            {error && <ErrorAlert message={error} onDismiss={dismissError} />}

            <form
                onSubmit={addTodoItem}
                style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 16 }}
            >
                <input
                    placeholder={localize('home.newTodo.placeholder')}
                    value={title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                    required
                />
                <button type="submit">{localize('home.add')}</button>
            </form>

            <ul style={{ listStyle: 'none', padding: 0 }}>
                {todos.map((item: TodoItem) => (
                    <li
                        key={item.id}
                        style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', padding: 8, borderBottom: '1px solid #ddd' }}
                    >
                                    <span style={{ cursor: 'pointer' }} onClick={() => navigate(`/todo/${list?.id}/${item.id}`)}>
                                        {item.title} <span style={{ fontSize: 12, color: '#555' }}>[{stateLabel(item.state)}]</span>
                        </span>
                        <span style={{ display: 'flex', gap: 8 }}>
                            {item.state !== 'TODO' && (
                                <button onClick={() => transition(item, 'previous')}>
                                    {item.state === 'DONE' ? localize('todo.transition.inProgress') : localize('todo.transition.toBeDone')}
                                </button>
                            )}
                            {item.state !== 'DONE' && (
                                <button onClick={() => transition(item, 'next')}>
                                    {item.state === 'TODO' ? localize('todo.transition.inProgress') : localize('todo.transition.markDone')}
                                </button>
                            )}
                            <button onClick={() => deleteTodoItem(item)}>{localize('todo.delete')}</button>
                        </span>
                    </li>
                ))}
            </ul>

            <div style={{ position: 'fixed', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', pointerEvents: 'auto' }}>
                    <button onClick={openLists}>{localize('home.joinDifferent')}</button>
                    <button onClick={copyInviteLink} disabled={!list}>{localize('home.copyInviteKey')}</button>
                    {copied && <span style={{ fontSize: 12, color: '#2a7' }}>{localize('home.copied')}</span>}
                </div>
            </div>
        </div>
    );
}
