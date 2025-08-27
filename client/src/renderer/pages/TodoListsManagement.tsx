import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDefaultConfig } from '../app-configs';
import { getHeaders } from '../../utils/header-utils';
import ErrorAlert from '../components/ErrorAlert';
import UserHeader from '../components/UserHeader';
import type { TodoList } from '../models/models';
import { getCachedAuthToken } from '../../utils/auth-utils';
import { localize } from '../../localization/localizer';
import { routes } from '../models/navigation-routes';

const { host, todoListsEndpoint } = getDefaultConfig().todoListService;

const styles = {
    container: { padding: 16, maxWidth: 700, margin: '0 auto', fontFamily: 'system-ui' },
    list: { listStyle: 'none', padding: 0, marginBottom: 16 },
    listItem: { padding: 8, borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    listEmpty: { color: '#666' },
    joinForm: { display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 16 },
    createForm: { display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }
} as const;

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
            navigate(routes.default);
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

    const onCreate = useCallback(async (e: React.FormEvent) => {
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

            navigate(routes.home(todoList.id));
        } catch (e: any) {
            setError(e?.message || 'Failed to create list.');
        }
    }, [createName, navigate, host, todoListsEndpoint]);

    const onJoin = useCallback(async (e: React.FormEvent) => {
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

            navigate(routes.home(res.id));
        } catch (e: any) {
            setError(e?.message || 'Failed to join list.');
        }
    }, [joinKey, navigate, host, todoListsEndpoint]);

    const openList = useCallback((id: string) => navigate(routes.home(id)), [navigate]);
    const handleDismissError = useCallback(() => setError(null), []);

    return (
        <div style={styles.container}>
            <UserHeader title={localize('lists.title')} />
            {error && <ErrorAlert message={error} onDismiss={handleDismissError} />}
            <ul style={styles.list}>
                {lists.map(list => (
                    <li key={list.id} style={styles.listItem}>
                        <span>{list.name}</span>
                        <button onClick={() => openList(list.id)}>{localize('lists.open')}</button>
                    </li>
                ))}
                {lists.length === 0 && (
                    <li style={styles.listEmpty}>{localize('lists.empty')}</li>
                )}
            </ul>

            <form onSubmit={onJoin} style={styles.joinForm}>
                <input placeholder={localize('lists.join.placeholder')} value={joinKey} onChange={e => setJoinKey(e.target.value)} />
                <button type="submit">{localize('lists.join.submit')}</button>
            </form>

            <form onSubmit={onCreate} style={styles.createForm}>
                <input placeholder={localize('lists.create.placeholder')} value={createName} onChange={e => setCreateName(e.target.value)} />
                <button type="submit">{localize('lists.create.submit')}</button>
            </form>
        </div>
    );
}
