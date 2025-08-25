import type { ErrorResponsePayload } from './common';
import type { TodoList } from '../todo-list';

/** Request body for POST /lists */
export interface CreateTodoListRequestPayload {
    /**
     * The name of the list to create.
     */
    name: string;
}

/**
 * Request body for POST /lists/join
 */
export interface JoinTodoListRequestPayload {
    /**
     * The key of the list to join.
     */
    key: string;
}

/** Response body for POST /lists/join */
export interface JoinTodoListSuccessResponsePayload {
	/**
     * The ID of the joined list.
     */
    id: string;

    /**
     * The name of the joined list.
     */
    name: string;

    /**
     * The key of the joined list.
     */
    key: string;
}

/**
 * Response for POST /lists
 */
export type CreateTodoListResponse = TodoList | ErrorResponsePayload;

/**
 * Response for POST /lists/join
 */
export type JoinTodoListResponse = JoinTodoListSuccessResponsePayload | ErrorResponsePayload;

/**
 * Response for GET /lists
 */
export type GetAllTodoListsResponse = TodoList[] | ErrorResponsePayload;
