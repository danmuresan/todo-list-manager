import type { Request } from 'express';
import type { ParsedQs } from 'qs';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { JwtPayload } from '../auth/jwt-payload';

/**
 * Express Request with an optional authenticated user attached by auth middleware.
 */
export type AuthenticatedRequest<
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = ParsedQs
> = Request<P, ResBody, ReqBody, ReqQuery> & { user?: JwtPayload };

/**
 * Alias for routes with no path params.
 * Keeps handler signatures readable while satisfying Express type constraints.
 */
export type NoParams = Record<string, never>;
