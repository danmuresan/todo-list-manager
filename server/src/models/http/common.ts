/**
 * Error response payload for failed HTTP operations.
 */
export interface ErrorResponsePayload {
  /**
   * Error message explaining why the request failed.
   */
  error: string;
}

/**
 * Empty body used for 204 No Content responses.
 */
export interface NoContentResponsePayload {}
