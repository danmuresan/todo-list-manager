import { todo } from "node:test";

/**
 * Navigation routes for the application.
 */
export const routes = {
    /**
     * Default route.
     */
    default: '/',

    /**
     * TODO lists route.
     */
    todoLists: '/lists',

    /**
     * Home route
     * @param listId - The ID of the TODO list to navigate to.
     */
    home: (listId: string) => `/home/${listId}`,

    /**
     * TODO item route.
     * @param listId - The ID of the TODO list
     * @param todoId - The ID of the TODO item
     * @returns The route for the TODO item
     */
    todoItem: (listId: string, todoId: string) => `/todo/${listId}/${todoId}`,
} as const;