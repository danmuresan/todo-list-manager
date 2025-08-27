import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { localize } from '../../localization/localizer';
import { routes } from '../models/navigation-routes';

/**
 * Props for the UserHeader component.
 */
interface UserHeaderProps {
  /**
   * The title to display in the header.
   */
  title: string;
}

const styles = {
  container: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontSize: 20, margin: 0 },
  right: { display: 'flex', alignItems: 'center', gap: 12 },
  username: { color: '#444' }
} as const;

/**
 * Top-right user header rendering the current username and a Logout button.
 * Also displays a page title on the left.
 */
export default function UserHeader({ title }: UserHeaderProps) {
  const navigate = useNavigate();
  const username = typeof window !== 'undefined' ? localStorage.getItem('username') : null;

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    (window as any).electronAPI?.setupMainWindowBoundsForLogin();
    navigate(routes.default);
  }, [navigate]);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>{title}</h1>
      <div style={styles.right}>
        {username && (
          <span title={localize('header.signedInUser.tooltip')} style={styles.username}>{localize('header.userPrefix')} {username}</span>
        )}
        <button onClick={logout}>{localize('header.logout')}</button>
      </div>
    </div>
  );
}
