import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDefaultConfig } from '../app-configs';
import { getHeaders } from '../../utils/header-utils';
import ErrorAlert from '../components/ErrorAlert';

const { host, todoListsEndpoint } = getDefaultConfig().todoListService;

type List = { id: string; name: string; key: string };

function getToken() { return localStorage.getItem('token'); }

/**
 * TODO lists management page.
 */
export default function ListsPage() {
    const [lists, setLists] = useState<List[]>([]);
    const [createName, setCreateName] = useState('');
    const [joinKey, setJoinKey] = useState('');
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = getToken();
        if (!token) {
            navigate('/');
            return;
        }

        (async () => {
            try {
                const data: List[] = await fetch(
                    `${host}${todoListsEndpoint}`,
                    getHeaders(token)
                ).then(response => response.json());

                setLists(data);
            } catch (e: any) {
                setError(e?.message || 'Failed to load lists.');
            }
        })();
    }, [navigate]);

    async function onCreate(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        const token = getToken();

        if (!token || !createName.trim()) {
             return;
        }

        try {
            const list: List = await fetch(`${host}${todoListsEndpoint}`, {
                method: 'POST',
                ...getHeaders(token, 'application/json'),
                body: JSON.stringify({ name: createName.trim() })
            }).then(response => response.json());

            navigate(`/home/${list.id}`);
        } catch (e: any) {
            setError(e?.message || 'Failed to create list.');
        }
    }

    async function onJoin(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        const token = getToken();
        if (!token || !joinKey.trim()) {
            return;
        }

        try {
            const res: { id: string; name: string; key: string } = await fetch(`${host}${todoListsEndpoint}/join`, {
                method: 'POST',
                ...getHeaders(token, 'application/json'),
                body: JSON.stringify({ key: joinKey.trim() })
            }).then(response => response.json());

            navigate(`/home/${res.id}`);
        } catch (e: any) {
            setError(e?.message || 'Failed to join list.');
        }
    }

    return (
        <div style={{ padding: 16, maxWidth: 700, margin: '0 auto', fontFamily: 'system-ui' }}>
            <h1 style={{ fontSize: 20, marginBottom: 12 }}>Your Lists</h1>
            {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: 16 }}>
                {lists.map(l => (
                    <li key={l.id} style={{ padding: 8, borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{l.name}</span>
                        <button onClick={() => navigate(`/home/${l.id}`)}>Open</button>
                    </li>
                ))}
                {lists.length === 0 && (
                    <li style={{ color: '#666' }}>No lists yet. Create one or join with a key.</li>
                )}
            </ul>

            <form onSubmit={onJoin} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 16 }}>
                <input placeholder="Enter invite key to join" value={joinKey} onChange={e => setJoinKey(e.target.value)} />
                <button type="submit">Join</button>
            </form>

            <form onSubmit={onCreate} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                <input placeholder="New list name" value={createName} onChange={e => setCreateName(e.target.value)} />
                <button type="submit">Create & Open</button>
            </form>
        </div>
    );
}
