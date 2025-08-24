/**
 * A collaborative list that groups related todos and members.
 */
export interface TodoList {
  /**
   * Unique identifier of the list.
   */
  id: string;

  /**
   * Human-readable list name.
   */
  name: string;

  /**
   * Shared join key that allows users to join the list.
   */
  key: string;

  /**
   * User IDs who are members of the list.
   */
  members: string[];
}
