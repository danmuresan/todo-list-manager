import type { Response } from 'express';

/**
 * SSE (Server-Sent Events) connection service interface.
 */
export interface ISseConnectionService {
    /**
     * Allows a client to subscribe to a specific todo list.
     * @param listId - The ID of the todo list to subscribe to.
     * @param res - The response object representing the SSE connection.
     */
    subscribe(listId: string, res: Response): void;

    /**
     * Broadcasts an event to all clients subscribed to a specific todo list.
     * @param listId - The ID of the todo list to broadcast the event to.
     * @param event - The name of the event to broadcast.
     * @param payload - The data to include with the event.
     */
    broadcast<T extends object | string | number | boolean | null>(listId: string, event: string, payload?: T | T[]): void;
}
