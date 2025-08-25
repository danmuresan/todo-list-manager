import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { localize } from '../../localization/i18n';

/**
 * Top-right user header rendering the current username and a Logout button.
 * Also displays a page title on the left.
 */
export default function UserHeader({ title }: { title: string }) {
  const navigate = useNavigate();
  const username = typeof window !== 'undefined' ? localStorage.getItem('username') : null;

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    (window as any).electronAPI?.setupMainWindowBoundsForLogin();
    navigate('/');
  }, [navigate]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <h1 style={{ fontSize: 20, margin: 0 }}>{title}</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {username && (
          <span title={localize('header.signedInUser.tooltip')} style={{ color: '#444' }}>{localize('header.userPrefix')} {username}</span>
        )}
        <button onClick={logout}>{localize('header.logout')}</button>
      </div>
    </div>
  );
}
