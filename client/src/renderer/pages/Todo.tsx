import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDefaultConfig } from '../app-configs';

const apiBase = getDefaultConfig().todoListService.host;

type Todo = { id: string; listId: string; title: string; state: 'TODO'|'ONGOING'|'DONE' };
type List = { id: string; name: string; key: string };

export default function TodoPage() {
  const { listId, todoId } = useParams();
  const [list, setList] = useState<List | null>(null);
  const [todo, setTodo] = useState<Todo | null>(null);
  const navigate = useNavigate();

  const token = useMemo(() => localStorage.getItem('token'), []);

  useEffect(() => {
    if (!token) {
      return navigate('/');
    }
    (async () => {
      if (!listId || !todoId) {
        return;
      }
      const lists: List[] = await fetch(`${apiBase}/lists`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
      const l = lists.find(x => x.id === listId) || lists[0];
      if (!l) {
        return;
      }
      setList(l);
      const todos: Todo[] = await fetch(`${apiBase}/todos/${l.id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
      setTodo(todos.find(t => t.id === todoId) || null);
    })();
  }, [listId, todoId, navigate, token]);

  useEffect(() => {
    if (!list || !token) {
      return;
    }
    const es = new EventSource(`${apiBase}/lists/${list.id}/stream?token=${encodeURIComponent(token)}`);
    const refresh = async () => {
      const todos: Todo[] = await fetch(`${apiBase}/todos/${list.id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
      if (todo?.id) {
        setTodo(todos.find(t => t.id === todo.id) || null);
      }
    };
    es.addEventListener('todoUpdated', refresh);
    es.addEventListener('todoDeleted', () => navigate('/home'));
    es.addEventListener('todoCreated', refresh);
    return () => es.close();
  }, [list, token, todo?.id, navigate]);

  async function transition(direction: 'forward'|'back') {
    if (!list || !todo || !token) {
      return;
    }
    await fetch(`${apiBase}/todos/${list.id}/${todo.id}/transition`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ direction })
    });
  }

  async function del() {
    if (!list || !todo || !token) {
      return;
    }
    await fetch(`${apiBase}/todos/${list.id}/${todo.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
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
        <button onClick={() => transition('back')}>Back</button>
        <button onClick={() => transition('forward')}>Forward</button>
        <button onClick={del}>Delete</button>
      </div>
    </div>
  );
}
