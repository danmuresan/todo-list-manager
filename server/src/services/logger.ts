import type { ILogger } from './abstractions/logger-abstraction';

export class ConsoleLogger implements ILogger {
    public log(message?: unknown, ...optionalParams: unknown[]): void {
        // eslint-disable-next-line no-console
        console.log(message as string, ...optionalParams as []);
    }

    public info(message?: unknown, ...optionalParams: unknown[]): void {
        // eslint-disable-next-line no-console
        console.info(message as string, ...optionalParams as []);
    }

    public warn(message?: unknown, ...optionalParams: unknown[]): void {
        // eslint-disable-next-line no-console
        console.warn(message as string, ...optionalParams as []);
    }

    public error(message?: unknown, ...optionalParams: unknown[]): void {
        // eslint-disable-next-line no-console
        console.error(message as string, ...optionalParams as []);
    }

    public debug(message?: unknown, ...optionalParams: unknown[]): void {
        // eslint-disable-next-line no-console
        console.debug?.(message as string, ...optionalParams as []);
    }
}

export const logger = new ConsoleLogger();
