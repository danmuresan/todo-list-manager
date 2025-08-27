import React, { useEffect } from 'react';
import { localize } from '../../localization/localizer';
import { ERROR_ALERT_TIMEOUT } from '../models/consts';

/**
 * Props for the ErrorAlert component.
 */
interface ErrorAlertProps {
    /**
     * The error message to display.
     */
    message: string;

    /**
     * Callback function to call when the alert is dismissed.
     */
    onDismiss: () => void;

    /**
     * Optional timeout in milliseconds to automatically dismiss the alert.
     */
    timeoutMs?: number;

    /**
     * Optional CSS class name to apply to the alert container.
     */
    className?: string;
}

/**
 * Generic error alert banner component (manually and auto-disimissible).
 */
export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onDismiss, timeoutMs = ERROR_ALERT_TIMEOUT, className }) => {
    useEffect(() => {
        if (timeoutMs <= 0) {
            return;
        }
        const id = setTimeout(() => {
            onDismiss();
        }, timeoutMs);
        return () => clearTimeout(id);
    }, [timeoutMs, onDismiss]);

    if (!message) {
        return null;
    }

    const styles = {
        container: {
            backgroundColor: '#fdecea',
            color: '#611a15',
            border: '1px solid #f5c6cb',
            padding: '8px 12px',
            borderRadius: 4,
            margin: '8px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
        } as const,
        dismiss: {
            marginLeft: 12,
            background: 'transparent',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            fontSize: 14
        } as const
    };

    return (
        <div
            role="alert"
            aria-live="assertive"
            className={className ?? 'error-banner'}
            style={styles.container}
        >
            <span>{message}</span>
            <button
                type="button"
                onClick={onDismiss}
                aria-label={localize('common.dismiss.aria')}
                style={styles.dismiss}
            >
                {localize('common.dismiss')}
            </button>
        </div>
    );
};

export default ErrorAlert;
