import type { ErrorResponsePayload } from './common';
import type { TodoList } from '../todo-list';

/** Request body for POST /lists */
export interface CreateListRequestPayload {
    /**
     * The name of the list to create.
     */
    name: string;
}

/**
 * Request body for POST /lists/join
 */
export interface JoinListRequestPayload {
    /**
     * The key of the list to join.
     */
    key: string;
}

/** Request body for POST /lists/join */
export interface JoinListSuccessResponsePayload {
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
export type CreateListResponse = TodoList | ErrorResponsePayload;

/**
 * Response for POST /lists/join
 */
export type JoinListResponse = JoinListSuccessResponsePayload | ErrorResponsePayload;

/**
 * Response for GET /lists
 */
export type GetListsResponse = TodoList[] | ErrorResponsePayload;
