/**
 * Logger interface for application-wide logging.
 */
export interface ILogger {
    /**
     * Logs a message with optional parameters.
     * @param message - The message to log.
     * @param optionalParams - Additional parameters to include in the log.
     */
    log(message?: unknown, ...optionalParams: unknown[]): void;

    /**
     * Logs an informational message.
     * @param message - The message to log.
     * @param optionalParams - Additional parameters to include in the log.
     */
    info?(message?: unknown, ...optionalParams: unknown[]): void;

    /**
     * Logs a warning message.
     * @param message - The message to log.
     * @param optionalParams - Additional parameters to include in the log.
     */
    warn?(message?: unknown, ...optionalParams: unknown[]): void;

    /**
     * Logs an error message.
     * @param message - The message to log.
     * @param optionalParams - Additional parameters to include in the log.
     */
    error?(message?: unknown, ...optionalParams: unknown[]): void;

    /**
     * Logs a debug message.
     * @param message - The message to log.
     * @param optionalParams - Additional parameters to include in the log.
     */
    debug?(message?: unknown, ...optionalParams: unknown[]): void;
}
