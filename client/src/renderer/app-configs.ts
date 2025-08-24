import { ConfigSettings } from "./config-settings";

export function getDefaultConfig(): ConfigSettings {
    return {
        todoListService: {
            host: 'http://localhost:4000',
            todoListsEndpoint: '/lists',
            todoItemEndpoint: (id: string) => `/todos/${id}`,
            todoListUpdatesListenerEndpoint: (id: string, authToken: string) => `/lists/${id}/stream?token=${encodeURIComponent(authToken)}`,
            todoItemUpdateEndpoint: (todoItemId: string, todoListId: string) => `/todos/${todoListId}/${todoItemId}/transition`
        },
        authService: {
            host: 'http://localhost:4000',
            registerEndpoint: '/auth/register',
            authorizeEndpoint: '/auth/authorize',
        }
    }
}