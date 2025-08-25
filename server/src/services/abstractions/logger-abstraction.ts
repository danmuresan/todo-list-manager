/**
 * Logger interface for application-wide logging.
 */
export interface ILogger {
    log(message?: unknown, ...optionalParams: unknown[]): void;
    info?(message?: unknown, ...optionalParams: unknown[]): void;
    warn?(message?: unknown, ...optionalParams: unknown[]): void;
    error?(message?: unknown, ...optionalParams: unknown[]): void;
    debug?(message?: unknown, ...optionalParams: unknown[]): void;
}
