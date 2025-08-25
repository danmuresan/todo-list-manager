import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDefaultConfig } from '../app-configs';
import ErrorAlert from '../components/ErrorAlert';
import { localize } from '../../localization/i18n';

const { host, registerEndpoint } = getDefaultConfig().authService;

/**
 * User registration UI component.
 */
export default function RegisterUserPage() {
    const [username, setUsername] = useState('');
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const onSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);

            const registerResponse = await fetch(
				`${host}${registerEndpoint}`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ username }),
					signal: controller.signal
				}
			);

            clearTimeout(timeout);

            if (registerResponse.status === 409) {
                setError(localize('register.error.exists'));
                return;
            }

            if (!registerResponse.ok) {
                throw new Error(`${localize('register.error.failedPrefix')}${registerResponse.status}`);
            }

            const user = await registerResponse.json();

			// cache token and username
            localStorage.setItem('token', user.token);
            localStorage.setItem('username', username);

			// signal main window to resize as login completed
            window.electronAPI?.loginWindowCompleted();

			// navigate to lists management page
            navigate('/lists');
        } catch (err: any) {
            if (err?.name === 'AbortError') {
                setError(localize('register.error.timeout'));
            } else {
                setError(err?.message || localize('register.error.failed'));
            }
        }
    }, [navigate, username, registerEndpoint, host]);

    const handleDismissError = useCallback(() => setError(null), []);
    const goBack = useCallback(() => navigate('/'), [navigate]);

    return (
        <div style={{ padding: 16, maxWidth: 400, margin: '0 auto', fontFamily: 'system-ui' }}>
            <button onClick={goBack} style={{ marginBottom: 8 }}>{localize('register.back')}</button>
            <h1 style={{ fontSize: 20, marginBottom: 12 }}>{localize('register.title')}</h1>
            {error && (
                <ErrorAlert message={error!} onDismiss={handleDismissError} />
            )}
            <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8 }}>
                <input placeholder={localize('register.usernamePlaceholder')} value={username} onChange={e => setUsername((e.target as HTMLInputElement).value)} required />
                <button type="submit">{localize('register.submit')}</button>
            </form>
        </div>
    );
}
