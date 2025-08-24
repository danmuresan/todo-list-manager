import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDefaultConfig } from '../app-configs';

declare global {
  interface Window { electronAPI?: { setupMainWindowBoundsForLogin: () => void; loginWindowCompleted: () => void } }
}

const { host, authorizeEndpoint } = getDefaultConfig().authService;

/**
 * User login UI component.
 */
export default function Login() {
    const [username, setUsername] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        window.electronAPI?.setupMainWindowBoundsForLogin();
    }, []);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        const res = await fetch(`${host}${authorizeEndpoint}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username })
        });
        if (res.status === 401) {
            alert('No user found. Please create an account.');
            return;
        }
        const user = await res.json();
        localStorage.setItem('token', user.token);
        window.electronAPI?.loginWindowCompleted();
        navigate('/home');
    }

    return (
        <div style={{ padding: 16, maxWidth: 400, margin: '0 auto', fontFamily: 'system-ui' }}>
            <h1 style={{ fontSize: 20, marginBottom: 12 }}>Login</h1>
            <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8 }}>
                <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
                <button type="submit">Login</button>
            </form>
            <p> No account? <Link to="/register">Create one</Link> </p>
        </div>
    );
}
