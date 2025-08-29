/**
 * SSE (Server-Sent Events) broadcast events for the todo list.
 */
export const sseBroadcastPaths = {
    /**
     * Event triggered when a new todo item is created.
     */
    TODO_CREATED: 'todoCreated',

    /**
     * Event triggered when a todo item is updated.
     */
    TODO_UPDATED: 'todoUpdated',
    
    /**
     * Event triggered when a todo item is deleted.
     */
    TODO_DELETED: 'todoDeleted',
} as const;
