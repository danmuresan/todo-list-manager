/**
 * JWT token payload embedded in access tokens.
 */
export interface JwtPayload {
  /**
   * User ID contained in the token.
   */
  id: string;

  /**
   * Username contained in the token.
   */
  username: string;
}
