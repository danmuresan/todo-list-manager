import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDefaultConfig } from '../app-configs';
import { getHeaders } from '../../utils/header-utils';

const {
    host,
    todoItemEndpoint,
    todoListsEndpoint,
    todoListUpdatesListenerEndpoint: todoListUpdateEndpoint,
    todoItemUpdateEndpoint
} = getDefaultConfig().todoListService;

type Todo = { id: string; listId: string; title: string; state: 'TODO'|'ONGOING'|'DONE' };
type List = { id: string; name: string; key: string };

export default function TodoPage() {
    const { listId, todoId } = useParams();
    const [list, setList] = useState<List | null>(null);
    const [todo, setTodo] = useState<Todo | null>(null);
    const navigate = useNavigate();

    const authToken = useMemo(() => localStorage.getItem('token'), []);

    useEffect(() => {
        if (!authToken) {
            return navigate('/');
        }
        (async () => {
            if (!listId || !todoId) {
                return;
            }

            const allTodoLists: List[] = await fetch(
                `${host}${todoListsEndpoint}`,
                getHeaders(authToken)
            ).then(response => response.json());

            const matchingTodoList = allTodoLists.find(x => x.id === listId) || allTodoLists[0];
            if (!matchingTodoList) {
                return;
            }

            setList(matchingTodoList);

            const initialTodos: Todo[] = await fetch(
                `${host}${todoItemEndpoint(matchingTodoList.id)}`,
                getHeaders(authToken)
            ).then(r => r.json());

            setTodo(initialTodos.find(t => t.id === todoId) || null);
        })();
    }, [listId, todoId, navigate, authToken]);

    useEffect(() => {
        if (!list || !authToken) {
            return;
        }

        const eventSource = new EventSource(`${host}${todoListUpdateEndpoint(list.id, authToken)}`);
        
    const onListUpdated = async () => {
            const todoItems: Todo[] = await fetch(
                `${host}${todoItemEndpoint(list.id)}`,
                getHeaders(authToken)
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
    }, [list, authToken, todo?.id, navigate]);

    async function updateTodoItem(direction: 'forward' | 'back') {
        if (!list || !todo || !authToken) {
            return;
        }
        await fetch(`${host}${todoItemUpdateEndpoint(todo.id, list.id)}`, {
            method: 'POST',
            ...getHeaders(authToken,'application/json'),
            body: JSON.stringify({ direction })
        });
    }

    async function deleteTodoItem() {
        if (!list || !todo || !authToken) {
            return;
        }
        await fetch(`${host}${todoItemUpdateEndpoint(todo.id, list.id)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${authToken}` } });
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
                <button onClick={() => updateTodoItem('back')}>Back</button>
                <button onClick={() => updateTodoItem('forward')}>Forward</button>
                <button onClick={deleteTodoItem}>Delete</button>
            </div>
        </div>
    );
}
