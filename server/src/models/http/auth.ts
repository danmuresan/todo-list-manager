import type { ErrorResponsePayload } from './common';

/**
 * Body for POST /auth/register
 */
export interface RegisterRequestPayload {
  /**
   * Username to register.
   */
  username: string;
}

/**
 * Body for POST /auth/authorize
 */
export interface AuthorizeRequestPayload {
  /**
   * Username to authorize.
   */
  username: string;
}

/**
 * Response for POST /auth/register (200)
 */
export interface AuthSuccessResponsePayload {
  /**
   * The unique user ID.
   */
  id: string;

  /**
   * The user's username.
   */
  username: string;

  /**
   * The issued JWT token string.
   */
  token: string;
}

/**
 * Responses for auth endpoints
 */
export type RegisterResponse = AuthSuccessResponsePayload | ErrorResponsePayload;
export type AuthorizeResponse = AuthSuccessResponsePayload | ErrorResponsePayload;
