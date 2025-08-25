import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDefaultConfig } from '../app-configs';
import { getHeaders } from '../../utils/header-utils';
import ErrorAlert from '../components/ErrorAlert';

const {
    host,
    todoItemEndpoint,
    todoListsEndpoint,
    todoListUpdatesListenerEndpoint,
} = getDefaultConfig().todoListService;

type Todo = { id: string; listId: string; title: string; state: 'TODO'|'ONGOING'|'DONE' };
type List = { id: string; name: string; key: string };

export default function TodoPage() {
    const { listId, todoId } = useParams();
    const [list, setList] = useState<List | null>(null);
    const [todo, setTodo] = useState<Todo | null>(null);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const cachedAuthToken = useMemo(() => localStorage.getItem('token'), []);

    useEffect(() => {
        if (!cachedAuthToken) {
            return navigate('/');
        }
        (async () => {
            try {
                if (!listId || !todoId) {
                    return;
                }

                const allTodoLists: List[] = await fetch(
                    `${host}${todoListsEndpoint}`,
                    getHeaders(cachedAuthToken)
                ).then(response => response.json());

                const matchingTodoList = allTodoLists.find(x => x.id === listId) || allTodoLists[0];
                if (!matchingTodoList) {
                    return;
                }

                setList(matchingTodoList);

                const initialTodos: Todo[] = await fetch(
                    `${host}${todoItemEndpoint(matchingTodoList.id)}`,
                    getHeaders(cachedAuthToken)
                ).then(r => r.json());

                setTodo(initialTodos.find(t => t.id === todoId) || null);
            } catch (e: any) {
                setError(e?.message || 'Failed to load todo.');
            }
        })();
    }, [listId, todoId, navigate, cachedAuthToken]);

    useEffect(() => {
        if (!list || !cachedAuthToken) {
            return;
        }

        const eventSource = new EventSource(`${host}${todoListUpdatesListenerEndpoint(list.id, cachedAuthToken)}`);
        
        const onListUpdated = async () => {
            try {
                const todoItems: Todo[] = await fetch(
                    `${host}${todoItemEndpoint(list.id)}`,
                    getHeaders(cachedAuthToken)
                ).then(r => r.json());

                if (todo?.id) {
                    setTodo(todoItems.find(t => t.id === todo.id) || null);
                }
            } catch (e: any) {
                setError(e?.message || 'Failed to refresh todo.');
            }
        };

        const onListDeleted = () => {
            navigate('/home');
        };

        const onError = () => setError('Realtime connection lost. Retrying…');

        eventSource.addEventListener('todoUpdated', onListUpdated);
        eventSource.addEventListener('todoCreated', onListUpdated);
        eventSource.addEventListener('todoDeleted', onListDeleted);
        eventSource.addEventListener('error', onError as EventListener);

        return () => eventSource.close();
    }, [list, cachedAuthToken, todo?.id, navigate]);

    async function transitionStateForTodoItem(transitionItem: 'next' | 'previous') {
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
            setError(e?.message || 'Failed to update todo state.');
        }
    }

    async function deleteTodoItem() {
        if (!list || !todo || !cachedAuthToken) {
            return;
        }
        try {
            await fetch(`${host}${todoItemEndpoint(list.id, todo.id)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${cachedAuthToken}` } });
            navigate('/home');
        } catch (e: any) {
            setError(e?.message || 'Failed to delete todo.');
        }
    }

    if (!todo) {
        return <div style={{ padding: 16 }}>Loading…</div>;
    }

    return (
        <div style={{ padding: 16, maxWidth: 700, margin: '0 auto', fontFamily: 'system-ui' }}>
            <button onClick={() => navigate('/home')}>← Back</button>
            <h1 style={{ fontSize: 20 }}>{todo.title}</h1>
            {error && (
                <ErrorAlert message={error!} onDismiss={() => setError(null)} />
            )}
            <p>State: <strong>{todo.state}</strong></p>
            <div style={{ display: 'flex', gap: 8 }}>
                {todo.state !== 'TODO' && (
                    <button onClick={() => transitionStateForTodoItem('previous')}>
                        {todo.state === 'DONE' ? 'In Progress' : 'To Be Done'}
                    </button>
                )}
                {todo.state !== 'DONE' && (
                    <button onClick={() => transitionStateForTodoItem('next')}>
                        {todo.state === 'TODO' ? 'In Progress' : 'Mark Done'}
                    </button>
                )}
                <button onClick={deleteTodoItem}>Delete</button>
            </div>
        </div>
    );
}
