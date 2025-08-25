import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDefaultConfig } from '../app-configs';
import ErrorAlert from '../components/ErrorAlert';

const { host, registerEndpoint } = getDefaultConfig().authService;

/**
 * User registration UI component.
 */
export default function RegisterUserPage() {
    const [username, setUsername] = useState('');
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);
            const res = await fetch(`${host}${registerEndpoint}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username }), signal: controller.signal
            });
            clearTimeout(timeout);
            if (res.status === 409) {
                setError('User exists. Try login.');
                return;
            }
            if (!res.ok) {
                throw new Error(`Create failed: ${res.status}`);
            }
            const user = await res.json();
            localStorage.setItem('token', user.token);
            localStorage.setItem('username', username);
            window.electronAPI?.loginWindowCompleted();
            navigate('/lists');
        } catch (err: any) {
            if (err?.name === 'AbortError') {
                setError('Request timed out. Please check the server and try again.');
            } else {
                setError(err?.message || 'Failed to create account.');
            }
        }
    }

    return (
        <div style={{ padding: 16, maxWidth: 400, margin: '0 auto', fontFamily: 'system-ui' }}>
            <button onClick={() => navigate('/')} style={{ marginBottom: 8 }}>← Back</button>
            <h1 style={{ fontSize: 20, marginBottom: 12 }}>Create Account</h1>
            {error && (
                <ErrorAlert message={error!} onDismiss={() => setError(null)} />
            )}
            <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8 }}>
                <input placeholder="Username" value={username} onChange={e => setUsername((e.target as HTMLInputElement).value)} required />
                <button type="submit">Create</button>
            </form>
        </div>
    );
}
