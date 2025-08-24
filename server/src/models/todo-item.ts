/**
 * The allowed workflow states for a todo item.
 */
export enum TodoItemState {
  /**
   * Item is not started yet.
   */
  ToDo = 'TODO',

  /**
   * Work on the item is in progress.
   */
  Ongoing = 'ONGOING',

  /**
   * Item is completed.
   */
  Done = 'DONE'
}

/**
 * A single task within a list, transitioned through states.
 */
export interface TodoItem {
  /**
   * Unique identifier of the todo.
   */
  id: string;

  /**
   * The owning list ID this todo belongs to.
   */
  listId: string;

  /**
   * Brief title of the task.
   */
  title: string;

  /**
   * Current workflow state of the task.
   */
  state: TodoItemState;

  /**
   * ID of the user who created the todo.
   */
  createdBy: string;

  /**
   * ISO timestamp when the todo was last updated.
   */
  updatedAt: string;
}

/**
 * Type-safe transition table between todo states.
 */
export interface TodoItemStateTransition {
  /**
   * Next state when moving forward.
   */
  nextState?: TodoItemState;

  /**
   * Previous state when moving back.
   */
  previousState?: TodoItemState;
}