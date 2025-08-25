import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDefaultConfig } from '../app-configs';
import { getHeaders } from '../../utils/header-utils';

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
    const navigate = useNavigate();

    const cachedAuthToken = useMemo(() => localStorage.getItem('token'), []);

    useEffect(() => {
        if (!cachedAuthToken) {
            return navigate('/');
        }
        (async () => {
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
        })();
    }, [listId, todoId, navigate, cachedAuthToken]);

    useEffect(() => {
        if (!list || !cachedAuthToken) {
            return;
        }

        const eventSource = new EventSource(`${host}${todoListUpdatesListenerEndpoint(list.id, cachedAuthToken)}`);
        
    const onListUpdated = async () => {
            const todoItems: Todo[] = await fetch(
                `${host}${todoItemEndpoint(list.id)}`,
                getHeaders(cachedAuthToken)
            ).then(r => r.json());

            if (todo?.id) {
                setTodo(todoItems.find(t => t.id === todo.id) || null);
            }
        };

        const onListDeleted = () => {
            navigate('/home');
        };

        eventSource.addEventListener('todoUpdated', onListUpdated);
        eventSource.addEventListener('todoCreated', onListUpdated);
        eventSource.addEventListener('todoDeleted', onListDeleted);

        return () => eventSource.close();
    }, [list, cachedAuthToken, todo?.id, navigate]);

    async function transitionStateForTodoItem(transitionItem: 'next' | 'previous') {
        if (!list || !todo || !cachedAuthToken) {
            return;
        }
        await fetch(`${host}${todoItemEndpoint(list.id, todo.id, true)}`, {
            method: 'POST',
            ...getHeaders(cachedAuthToken,'application/json'),
            body: JSON.stringify({ transitionItem })
        });
    }

    async function deleteTodoItem() {
        if (!list || !todo || !cachedAuthToken) {
            return;
        }
        await fetch(`${host}${todoItemEndpoint(list.id, todo.id)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${cachedAuthToken}` } });
        navigate('/home');
    }

    if (!todo) {
        return <div style={{ padding: 16 }}>Loading…</div>;
    }

    return (
        <div style={{ padding: 16, maxWidth: 700, margin: '0 auto', fontFamily: 'system-ui' }}>
            <button onClick={() => navigate('/home')}>← Back</button>
            <h1 style={{ fontSize: 20 }}>{todo.title}</h1>
            <p>State: <strong>{todo.state}</strong></p>
            <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => transitionStateForTodoItem('previous')}>Back</button>
                <button onClick={() => transitionStateForTodoItem('next')}>Forward</button>
                <button onClick={deleteTodoItem}>Delete</button>
            </div>
        </div>
    );
}
