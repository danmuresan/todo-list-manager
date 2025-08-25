import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

    useEffect(() => {
        const token = getCachedAuthToken();
        if (!token) {
            navigate('/');
            return;
        }

        (async () => {
            try {
                const todoList = await createTodoListIfNeeded();
                if (todoList) {
                    setList(todoList);
                    const data = await fetch(`${host}${todoItemEndpoint(todoList.id)}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
                    setTodos(data);
                }
            } catch (e: any) {
                setError(e?.message || 'Failed to load todos.');
            }
        })();
    }, [navigate]);

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

    async function createTodoListIfNeeded(): Promise<List | null> {
        const authToken = getCachedAuthToken();
        if (!authToken) {
            return null;
        }
        try {
            const lists: List[] = await fetch(`${host}${todoListsEndpoint}`, { headers: { Authorization: `Bearer ${authToken}` } }).then(r => r.json());
            if (lists.length > 0) {
                return lists[0];
            }
            return await fetch(
                `${host}${todoListsEndpoint}`, {
                    method: 'POST',
                    ...getHeaders(authToken, 'application/json'),
                    body: JSON.stringify({ 
                        name: 'My List' 
                    })
                }).then(response => response.json());
        } catch (e: any) {
            setError(e?.message || 'Failed to create or load list.');
            return null;
        }
    }

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

    return (
        <div style={{ padding: 16, maxWidth: 800, margin: '0 auto', fontFamily: 'system-ui' }}>
            <h1 style={{ fontSize: 20, marginBottom: 12 }}>My TODOs</h1>
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
                            <button onClick={() => transition(t, 'previous')}>Back</button>
                            <button onClick={() => transition(t, 'next')}>Forward</button>
                            <button onClick={() => deleteTodoItem(t)}>Delete</button>
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
