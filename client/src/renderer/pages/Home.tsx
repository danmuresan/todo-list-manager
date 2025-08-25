import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDefaultConfig } from '../app-configs';
import { getHeaders } from '../../utils/header-utils';
import ErrorAlert from '../components/ErrorAlert';
import type { TodoItem, TodoList } from '../models/models';
import { getCachedAuthToken } from '../../utils/auth-utils';
import UserHeader from '../components/UserHeader';
import { writeTextToClipboard, buildInviteText } from '../../utils/clipboard-utils';

const { 
    host,
    todoListsEndpoint,
    todoListUpdatesListenerEndpoint,
    todoItemEndpoint
} = getDefaultConfig().todoListService;

// types and token helper are now shared

/**
 * Home page UI component (list of TODO items in a list)
 */
export default function Home() {
    const [list, setList] = useState<TodoList | null>(null);
    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [title, setTitle] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const navigate = useNavigate();
    const { listId } = useParams();

    // After navigating to Home (post-login), ensure the main window is resized/widened
    useEffect(() => {
        // Cast to any to avoid coupling this file to the global typing
        setTimeout(() => (window as any).electronAPI?.loginWindowCompleted(), 0);
    }, []);

    useEffect(() => {
        const token = getCachedAuthToken();
        if (!token) {
            navigate('/');
            return;
        }
    // UserHeader reads username directly from localStorage

        // Enforce lists-first flow: require a listId in the route
        if (!listId) {
            navigate('/lists');
            return;
        }

        (async () => {
            try {
                // Validate membership and get the list info
                const lists: TodoList[] = await fetch(
                    `${host}${todoListsEndpoint}`,
                    getHeaders(token)
                ).then(r => r.json());

                // Find the selected list
                const selected = lists.find(l => l.id === listId) || null;
                if (!selected) {
                    setError('You are not a member of this list or it does not exist.');
                    navigate('/lists');
                    return;
                }
                setList(selected);

                // Load todos for the selected list
                const todoItemsFromList: TodoItem[] = await fetch(
                    `${host}${todoItemEndpoint(selected.id)}`,
                    getHeaders(token)
                ).then(response => response.json());
                setTodos(todoItemsFromList);
            } catch (e: any) {
                setError(e?.message || 'Failed to load todos.');
            }
        })();
    }, [navigate, listId]);

    useEffect(() => {
        if (!list) {
            return;
        }

        const token = getCachedAuthToken();
        if (!token) {
            return;
        }

        const eventSource = new EventSource(`${host}${todoListUpdatesListenerEndpoint(list.id, token)}`);
        const onReloadRequested = async () => {
            try {
                const data = await fetch(
                    `${host}${todoItemEndpoint(list.id)}`,
                    getHeaders(token)
                ).then(response => response.json());
                setTodos(data);
            } catch (e: any) {
                setError(e?.message || 'Failed to refresh todos.');
            }
        };
        
        const onError = () => setError('Realtime connection lost. Retrying…');

        eventSource.addEventListener('todoCreated', onReloadRequested);
        eventSource.addEventListener('todoUpdated', onReloadRequested);
        eventSource.addEventListener('todoDeleted', onReloadRequested);
        eventSource.addEventListener('error', onError as EventListener);

        return () => eventSource.close();
    }, [list]);

    const token = useMemo(() => getCachedAuthToken(), [list]);

    async function addTodoItem(e: React.FormEvent) {
        e.preventDefault();
        if (!list || !token || !title.trim()) {
            return;
        }

        try {
            await fetch(`${host}${todoItemEndpoint(list.id)}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ title })
            });

            setTitle('');
        } catch (e: any) {
            setError(e?.message || 'Failed to add todo.');
        }
    }

    async function deleteTodoItem(todoItem: TodoItem) {
        if (!list || !token) {
            return;
        }
        
        try {
            await fetch(
                `${host}${todoItemEndpoint(list.id, todoItem.id)}`,
                { 
                    method: 'DELETE',
                    ...getHeaders(token)
                });
        } catch (e: any) {
            setError(e?.message || 'Failed to delete todo.');
        }
    }

    async function transition(todoItem: TodoItem, transitionItem: 'next' | 'previous') {
        if (!list || !token) {
            return;
        }

        try {
            await fetch(
                `${host}${todoItemEndpoint(list.id, todoItem.id, true)}`,
                {
                    method: 'POST',
                    ...getHeaders(token, 'application/json'),
                    body: JSON.stringify({ transitionItem })
                });
        } catch (e: any) {
            setError(e?.message || 'Failed to update todo state.');
        }
    }

    async function copyInviteLink() {
        if (!list) {
            return;
        } 

        const text = buildInviteText(list.name, list.key, `${host}${todoListsEndpoint}/join`);
        const ok = writeTextToClipboard(text);

        if (ok) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } else {
            setError('Clipboard is unavailable in this environment.');
        }
    }

    return (
        <div style={{ padding: 16, maxWidth: 800, margin: '0 auto', fontFamily: 'system-ui' }}>
            <UserHeader title={list ? `${list.name} – Todos` : 'Todos'} />
            {error && (
                <ErrorAlert message={error!} onDismiss={() => setError(null)} />
            )}
            <form onSubmit={addTodoItem} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 16 }}>
                <input placeholder="New todo title" value={title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} required />
                <button type="submit">Add</button>
            </form>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {todos.map((t: TodoItem) => (
                    <li key={t.id} style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', padding: 8, borderBottom: '1px solid #ddd' }}>
                        <span style={{ cursor: 'pointer' }} onClick={() => navigate(`/todo/${list?.id}/${t.id}`)}>
                            {t.title} <span style={{ fontSize: 12, color: '#555' }}>[{t.state}]</span>
                        </span>
                        <span style={{ display: 'flex', gap: 8 }}>
                            {t.state !== 'TODO' && (
                                <button onClick={() => transition(t, 'previous')}>
                                    {t.state === 'DONE' ? 'In Progress' : 'To Be Done'}
                                </button>
                            )}
                            {t.state !== 'DONE' && (
                                <button onClick={() => transition(t, 'next')}>
                                    {t.state === 'TODO' ? 'In Progress' : 'Mark Done'}
                                </button>
                            )}
                            <button onClick={() => deleteTodoItem(t)}>Delete</button>
                        </span>
                    </li>
                ))}
            </ul>

            {/* Pinned bottom button to allow joining a different list */}
            <div style={{ position: 'fixed', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', pointerEvents: 'auto' }}>
                    <button onClick={() => navigate('/lists')}>Join a different list</button>
                        <button onClick={copyInviteLink} disabled={!list}>Copy invite key</button>
                    {copied && <span style={{ fontSize: 12, color: '#2a7' }}>Copied!</span>}
                </div>
            </div>
        </div>
    );
}
