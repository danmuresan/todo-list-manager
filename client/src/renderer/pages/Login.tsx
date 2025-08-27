import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDefaultConfig } from '../app-configs';
import ErrorAlert from '../components/ErrorAlert';
import { localize } from '../../localization/localizer';
import { routes } from '../models/navigation-routes';

const { host, authorizeEndpoint } = getDefaultConfig().authService;

const styles = {
    container: { padding: 16, maxWidth: 400, margin: '0 auto', fontFamily: 'system-ui' },
    title: { fontSize: 20, marginBottom: 12 },
    form: { display: 'grid', gap: 8 }
} as const;

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

    const onSubmit = useCallback(async (e: React.FormEvent) => {
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
            navigate(routes.todoLists);
        } catch (err: any) {
            if (err?.name === 'AbortError') {
                setError(localize('login.error.timeout'));
            } else {
                setError(err?.message || localize('login.error.failed'));
            }
        }
    }, [navigate, username, authorizeEndpoint, host]);

	const handleDismissError = useCallback(() => setError(null), []);

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>{localize('login.title')}</h1>
            {error && (
                <ErrorAlert message={error!} onDismiss={handleDismissError} />
            )}
            <form onSubmit={onSubmit} style={styles.form}>
                <input placeholder={localize('login.usernamePlaceholder')} value={username} onChange={e => setUsername(e.target.value)} required />
                <button type="submit">{localize('login.submit')}</button>
            </form>
            <p> {localize('login.noAccountPrefix')} <Link to="/register">{localize('login.createOneLink')}</Link> </p>
        </div>
    );
}
