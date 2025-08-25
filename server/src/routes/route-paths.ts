// Centralized route path constants for all routers.

export const AUTH_ROUTES = {
  register: '/register',
  authorize: '/authorize',
} as const;

export const TODO_LIST_ROUTES = {
  root: '/',
  join: '/join',
  stream: '/:listId/stream',
} as const;

export const TODO_ITEM_ROUTES = {
  byList: '/:listId',
  create: '/:listId', // same path as byList, different method
  transition: '/:listId/:todoId/transition',
  delete: '/:listId/:todoId',
} as const;
