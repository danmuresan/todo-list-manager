/**
 * Represents an application user capable of owning and joining lists.
 */
export interface User {
	/**
	 * Unique identifier of the user.
	 */
	id: string;

	/**
	 * Unique username used for login/authorization.
	 */
	username: string;

	/**
	 * Latest issued JWT for the user (rotated on authorize).
	 */
	token: string;
}
