import { Response } from 'express';
import type { ISseService } from './abstractions/sse-service-abstraction';
import type { ILogger } from './abstractions/logger-abstraction';
import { logger as defaultLogger } from './logger';

type SSEClient = Response;
type Primitive = string | number | boolean | null;

/**
 * Server-Sent Events (SSE) service for managing SSE connections and broadcasting events.
 */
class SseService implements ISseService {
    private clientsByList: Map<string, Set<SSEClient>> = new Map();
    private readonly logger: ILogger;

    public constructor(logger: ILogger = defaultLogger) {
        this.logger = logger;
    }

    public subscribe(listId: string, res: SSEClient): void {
        if (!this.clientsByList.has(listId)) {
            this.clientsByList.set(listId, new Set());
        }
        const set = this.clientsByList.get(listId)!;
        set.add(res);

        res.write(`: connected\n\n`);

        const ping = setInterval((): void => {
            try {
                res.write(`event: ping\n`);
                res.write(`data: ${Date.now()}\n\n`);
            } catch (err) {
                this.logger.error?.('[SSE] ping write error:', (err as Error).message);
            }
        }, 25000);

        res.on('close', (): void => {
            clearInterval(ping);
            set.delete(res);
            if (set.size === 0) {
                this.clientsByList.delete(listId);
            }
        });
    }

    public broadcast<T extends object | Primitive>(listId: string, event: string, payload?: T | T[]): void {
        const set = this.clientsByList.get(listId);
        if (!set || set.size === 0) {
            return;
        }
        const data = JSON.stringify(payload ?? {});
        for (const res of set) {
            try {
                res.write(`event: ${event}\n`);
                res.write(`data: ${data}\n\n`);
            } catch (err) {
                this.logger.error?.('[SSE] broadcast write error:', (err as Error).message);
            }
        }
    }
}

export const sse = new SseService();
export default SseService;

