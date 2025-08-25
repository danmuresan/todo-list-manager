import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDefaultConfig } from '../app-configs';
import { getHeaders } from '../../utils/header-utils';
import ErrorAlert from '../components/ErrorAlert';

const { 
    host,
    todoListsEndpoint,
    todoListUpdatesListenerEndpoint,
    todoItemEndpoint
} = getDefaultConfig().todoListService;

type Todo = { id: string; listId: string; title: string; state: 'TODO'|'ONGOING'|'DONE' };
type List = { id: string; name: string; key: string };

function getCachedAuthToken() { return localStorage.getItem('token'); }

export default function Home() {
    const [list, setList] = useState<List | null>(null);
    const [todos, setTodos] = useState<Todo[]>([]);
    const [title, setTitle] = useState('');
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const [username, setUsername] = useState<string | null>(null);
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
        // Load username if available
        setUsername(localStorage.getItem('username'));

        // Enforce lists-first flow: require a listId in the route
        if (!listId) {
            navigate('/lists');
            return;
        }

        (async () => {
            try {
                // Validate membership and get the list info
                const lists: List[] = await fetch(
                    `${host}${todoListsEndpoint}`,
                    getHeaders(token)
                ).then(r => r.json());

                const selected = lists.find(l => l.id === listId) || null;
                if (!selected) {
                    setError('You are not a member of this list or it does not exist.');
                    navigate('/lists');
                    return;
                }
                setList(selected);

                // Load todos for the selected list
                const data: Todo[] = await fetch(
                    `${host}${todoItemEndpoint(selected.id)}`,
                    getHeaders(token)
                ).then(r => r.json());
                setTodos(data);
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

    async function deleteTodoItem(todoItem: Todo) {
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

    async function transition(todoItem: Todo, transitionItem: 'next' | 'previous') {
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

    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        // Resize back to login window size immediately
        (window as any).electronAPI?.setupMainWindowBoundsForLogin();
        navigate('/');
    }

    return (
        <div style={{ padding: 16, maxWidth: 800, margin: '0 auto', fontFamily: 'system-ui' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h1 style={{ fontSize: 20, margin: 0 }}>{list ? `${list.name} – Todos` : 'Todos'}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {username && (
                        <span title="Signed in user" style={{ color: '#444' }}>User: {username}</span>
                    )}
                    <button onClick={logout}>Logout</button>
                </div>
            </div>
            {error && (
                <ErrorAlert message={error!} onDismiss={() => setError(null)} />
            )}
            <form onSubmit={addTodoItem} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 16 }}>
                <input placeholder="New todo title" value={title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} required />
                <button type="submit">Add</button>
            </form>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {todos.map((t: Todo) => (
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
                <button style={{ pointerEvents: 'auto' }} onClick={() => navigate('/lists')}>Join a different list</button>
            </div>
        </div>
    );
}
