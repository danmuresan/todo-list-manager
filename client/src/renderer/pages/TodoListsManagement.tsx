import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDefaultConfig } from '../app-configs';
import { getHeaders } from '../../utils/header-utils';
import ErrorAlert from '../components/ErrorAlert';
import UserHeader from '../components/UserHeader';
import type { TodoList } from '../models/models';
import { getCachedAuthToken } from '../../utils/auth-utils';
import { localize } from '../../localization/i18n';

const { host, todoListsEndpoint } = getDefaultConfig().todoListService;

/**
 * TODO lists management page.
 */
export default function TodoListsManagementPage() {
    const [lists, setLists] = useState<TodoList[]>([]);
    const [createName, setCreateName] = useState('');
    const [joinKey, setJoinKey] = useState('');
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
                const data: TodoList[] = await fetch(
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
        const token = getCachedAuthToken();

        if (!token || !createName.trim()) {
            return;
        }

        try {
            const todoList: TodoList = await fetch(`${host}${todoListsEndpoint}`, {
                method: 'POST',
                ...getHeaders(token, 'application/json'),
                body: JSON.stringify({ name: createName.trim() })
            }).then(response => response.json());

            navigate(`/home/${todoList.id}`);
        } catch (e: any) {
            setError(e?.message || 'Failed to create list.');
        }
    }

    async function onJoin(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        const token = getCachedAuthToken();

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
            <UserHeader title={localize('lists.title')} />
            {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: 16 }}>
                {lists.map(list => (
                    <li key={list.id} style={{ padding: 8, borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{list.name}</span>
                        <button onClick={() => navigate(`/home/${list.id}`)}>{localize('lists.open')}</button>
                    </li>
                ))}
                {lists.length === 0 && (
                    <li style={{ color: '#666' }}>{localize('lists.empty')}</li>
                )}
            </ul>

            <form onSubmit={onJoin} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 16 }}>
                <input placeholder={localize('lists.join.placeholder')} value={joinKey} onChange={e => setJoinKey(e.target.value)} />
                <button type="submit">{localize('lists.join.submit')}</button>
            </form>

            <form onSubmit={onCreate} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                <input placeholder={localize('lists.create.placeholder')} value={createName} onChange={e => setCreateName(e.target.value)} />
                <button type="submit">{localize('lists.create.submit')}</button>
            </form>
        </div>
    );
}
