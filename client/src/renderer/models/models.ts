/**
 * A single todo item belonging to a list.
 *
 * Invariant: `state` is one of 'TODO' | 'ONGOING' | 'DONE'.
 */
export interface TodoItem {
  /** Unique identifier of the todo item */
  id: string;
  /** The id of the list this todo belongs to */
  listId: string;
  /** Human friendly title */
  title: string;
  /**
   * Current workflow state.
   * - 'TODO'     -> not started
   * - 'ONGOING'  -> in progress
   * - 'DONE'     -> completed
   */
  state: 'TODO' | 'ONGOING' | 'DONE';
}

/**
 * A collaborative todo list which can be joined via an invite `key`.
 */
export interface TodoList {
  /** Unique identifier of the list */
  id: string;
  /** Display name */
  name: string;
  /** Invite key used to join the list */
  key: string;
}
