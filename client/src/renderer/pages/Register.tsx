import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDefaultConfig } from '../app-configs';

const { host, registerEndpoint } = getDefaultConfig().authService;

/**
 * User registration UI component.
 */
export default function Register() {
    const [username, setUsername] = useState('');
    const navigate = useNavigate();

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        const res = await fetch(`${host}${registerEndpoint}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username })
        });
        if (res.status === 409) {
            alert('User exists. Try login.');
            return;
        }
        const user = await res.json();
        localStorage.setItem('token', user.token);
        window.electronAPI?.loginWindowCompleted();
        navigate('/home');
    }

    return (
        <div style={{ padding: 16, maxWidth: 400, margin: '0 auto', fontFamily: 'system-ui' }}>
            <h1 style={{ fontSize: 20, marginBottom: 12 }}>Create Account</h1>
            <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8 }}>
                <input placeholder="Username" value={username} onChange={e => setUsername((e.target as HTMLInputElement).value)} required />
                <button type="submit">Create</button>
            </form>
        </div>
    );
}
