import React, { useEffect } from 'react';

interface ErrorAlertProps {
    message: string;
    onDismiss: () => void;
    timeoutMs?: number;
    className?: string;
}

/**
 * Generic error alert banner component (manually and auto-disimissible).
 */
export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onDismiss, timeoutMs = 5000, className }) => {
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

    return (
        <div
            role="alert"
            aria-live="assertive"
            className={className ?? 'error-banner'}
            style={{
                backgroundColor: '#fdecea',
                color: '#611a15',
                border: '1px solid #f5c6cb',
                padding: '8px 12px',
                borderRadius: 4,
                margin: '8px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}
        >
            <span>{message}</span>
            <button
                type="button"
                onClick={onDismiss}
                aria-label="Dismiss error"
                style={{
                    marginLeft: 12,
                    background: 'transparent',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    fontSize: 14
                }}
            >
                Dismiss
            </button>
        </div>
    );
};

export default ErrorAlert;
