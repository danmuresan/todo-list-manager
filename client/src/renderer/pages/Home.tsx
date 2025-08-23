import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDefaultConfig } from '../app-configs';

const apiBase = getDefaultConfig().todoListService.host;
type Todo = { id: string; listId: string; title: string; state: 'TODO'|'ONGOING'|'DONE' };
type List = { id: string; name: string; key: string };

function getToken() { return localStorage.getItem('token'); }

export default function Home() {
  const [list, setList] = useState<List | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/');
    }
    (async () => {
      const l = await ensureList();
      if (l) {
        setList(l);
        const data = await fetch(`${apiBase}/todos/${l.id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
        setTodos(data);
      }
    })();
  }, [navigate]);

  useEffect(() => {
    if (!list) {
      return;
    }
    const token = getToken();
    if (!token) {
      return;
    }
    const es = new EventSource(`${apiBase}/lists/${list.id}/stream?token=${encodeURIComponent(token)}`);
    const reload = async () => {
      const data = await fetch(`${apiBase}/todos/${list.id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
      setTodos(data);
    };
    es.addEventListener('todoCreated', reload);
    es.addEventListener('todoUpdated', reload);
    es.addEventListener('todoDeleted', reload);
    return () => es.close();
  }, [list]);

  const token = useMemo(() => getToken(), [list]);

  async function ensureList(): Promise<List | null> {
    const token = getToken();
    if (!token) {
      return null;
    }
    const lists: List[] = await fetch(`${apiBase}/lists`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
    if (lists.length > 0) {
      return lists[0];
    }
    return await fetch(`${apiBase}/lists`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ name: 'My List' })
    }).then(r => r.json());
  }

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!list || !token || !title.trim()) {
      return;
    }
    await fetch(`${apiBase}/todos/${list.id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ title })
    });
    setTitle('');
  }

  async function delTodo(t: Todo) {
    if (!list || !token) {
      return;
    }
    await fetch(`${apiBase}/todos/${list.id}/${t.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  }

  async function transition(t: Todo, direction: 'forward'|'back') {
    if (!list || !token) {
      return;
    }
    await fetch(`${apiBase}/todos/${list.id}/${t.id}/transition`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ direction }) });
  }

  return (
    <div style={{ padding: 16, maxWidth: 800, margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 20, marginBottom: 12 }}>My TODOs</h1>
      <form onSubmit={addTodo} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 16 }}>
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
              <button onClick={() => transition(t, 'back')}>Back</button>
              <button onClick={() => transition(t, 'forward')}>Forward</button>
              <button onClick={() => delTodo(t)}>Delete</button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
