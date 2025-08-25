import { ConfigSettings } from "./config-settings";

/**
 * Get default configuration object (for local development).
 */
export function getDefaultConfig(): ConfigSettings {
    return {
        todoListService: {
            host: 'http://localhost:4000',
            todoListsEndpoint: '/lists',
            todoItemEndpoint: (listId: string, todoItemId?: string, isTransitionOperation = false) => `/todos/${listId}/${todoItemId ? todoItemId : ''}${isTransitionOperation ? '/transition' : ''}`,
            todoListUpdatesListenerEndpoint: (id: string, authToken: string) => `/lists/${id}/stream?token=${encodeURIComponent(authToken)}`,
        },
        authService: {
            host: 'http://localhost:4000',
            registerEndpoint: '/auth/register',
            authorizeEndpoint: '/auth/authorize',
        }
    }
}