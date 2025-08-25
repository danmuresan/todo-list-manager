import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDefaultConfig } from '../app-configs';
import ErrorAlert from '../components/ErrorAlert';
import { localize } from '../../localization/i18n';

declare global {
  interface Window { electronAPI?: { setupMainWindowBoundsForLogin: () => void; loginWindowCompleted: () => void } }
}

const { host, authorizeEndpoint } = getDefaultConfig().authService;

/**
 * User login UI component.
 */
export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        window.electronAPI?.setupMainWindowBoundsForLogin();
    }, []);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);

            const authorizeResponse = await fetch(
				`${host}${authorizeEndpoint}`,
				{
                	method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ username }),
					signal: controller.signal
            });

            clearTimeout(timeout);

            if (authorizeResponse.status === 401) {
                setError(localize('login.error.notFound'));
                return;
            }

            if (!authorizeResponse.ok) {
                throw new Error(`${localize('login.error.failed')} ${authorizeResponse.status}`);
            }

            const user = await authorizeResponse.json();

			// cache token and username
            localStorage.setItem('token', user.token);
            localStorage.setItem('username', username);

			// signal main window to resize as login completed
            window.electronAPI?.loginWindowCompleted();

			// navigate to lists management page
            navigate('/lists');
        } catch (err: any) {
            if (err?.name === 'AbortError') {
                setError(localize('login.error.timeout'));
            } else {
                setError(err?.message || localize('login.error.failed'));
            }
        }
    }

    return (
        <div style={{ padding: 16, maxWidth: 400, margin: '0 auto', fontFamily: 'system-ui' }}>
            <h1 style={{ fontSize: 20, marginBottom: 12 }}>{localize('login.title')}</h1>
            {error && (
                <ErrorAlert message={error!} onDismiss={() => setError(null)} />
            )}
            <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8 }}>
                <input placeholder={localize('login.usernamePlaceholder')} value={username} onChange={e => setUsername(e.target.value)} required />
                <button type="submit">{localize('login.submit')}</button>
            </form>
            <p> {localize('login.noAccountPrefix')} <Link to="/register">{localize('login.createOneLink')}</Link> </p>
        </div>
    );
}
