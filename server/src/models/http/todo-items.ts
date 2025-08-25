import type { ErrorResponsePayload, NoContentResponsePayload } from './common';
import type { TodoItem } from '../todo-item';

/**
 * Params for GET /todos/:listId
 */
export interface GetTodoItemsRequestParams {
  /**
   * The list identifier to fetch todos for.
   */
  listId: string;
}

/**
 * Response for GET /todos/:listId
 */
export type GetTodosResponse = TodoItem[] | ErrorResponsePayload;

/**
 * Body for POST /todos/:listId
 */
export interface CreateTodoItemRequestPayload {
  /**
   * The title of the todo item.
   */
  title: string;
}

/**
 * Response for POST /todos/:listId
 */
export type CreateTodoResponse = TodoItem | ErrorResponsePayload;

/**
 * Params for POST /todos/:listId/:todoId/transition
 */
export interface TransitionTodoItemStateRequestParams {
  /**
   * The list containing the target todo.
   */
  listId: string;

  /**
   * The todo to transition.
   */
  todoId: string;
}

/**
 * Body for transition
 */
export interface TransitionTodoItemStateRequestPayload {
  /**
   * The transition to perform: move to next or previous state.
   */
  transitionItem: 'next' | 'previous';
}

/**
 * Response for todo transition
 */
export type TransitionTodoItemResponse = TodoItem | ErrorResponsePayload;

/**
 * Params for DELETE /todos/:listId/:todoId
 */
export interface DeleteTodoItemRequestParams {
  /**
   * The list containing the todo.
   */
  listId: string;

  /**
   * The todo identifier to delete.
   */
  todoId: string;
}

/**
 * Response for delete
 */
export type DeleteTodoResponse = NoContentResponsePayload | ErrorResponsePayload;
