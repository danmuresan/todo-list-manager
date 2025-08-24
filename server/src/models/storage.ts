import type { User } from './user';
import type { TodoList } from './todo-list';
import type { TodoItem } from './todo-item';

/**
 * Persistent data store shape serialized to JSON on disk.
 */
export interface Storage {
  /**
   * All registered users.
   */
  users: User[];

  /**
   * All lists, regardless of ownership.
   */
  lists: TodoList[];

  /**
   * All todos across all lists.
   */
  todos: TodoItem[];
}
