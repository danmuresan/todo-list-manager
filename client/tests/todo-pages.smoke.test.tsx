import React from 'react';
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import HomePage from '../src/renderer/pages/Home';
import TodoItemView from '../src/renderer/pages/TodoItemView';

type MockResponse = { ok: true; status: number; json: () => Promise<any> };

function getApiMockResponse(data: any, status = 200): MockResponse {
    return { ok: true, status, json: async () => data } as MockResponse;
}

describe('todo item management pages (smoke)', () => {
    const LIST_ID = 'list-1';
    const TODO_ID = 'todo-1';
    const TOKEN = 'test-token';

    beforeEach(() => {
        // Token present so pages don’t redirect
        localStorage.setItem('token', TOKEN);

        // Minimal EventSource mock used by pages
        (global as any).EventSource = class {
            public url: string;
            public constructor(url: string) { this.url = url; }
            public addEventListener() { /* noop */ }
            public close() { /* noop */ }
        } as any;
    });

    afterEach(() => {
        if ((global as any).fetch) {
            (global as any).fetch.mockReset?.();
        }
        localStorage.clear();
    });

    test('Home page loads list + todos and sends transition with transitionItem=next', async () => {
        const fetchMock = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input);

            if (url.includes('/lists') && !url.includes('/todos/')) {
                // GET /lists -> one list exists
                return getApiMockResponse([{ id: LIST_ID, name: 'L', key: 'K' }]);
            }

            // Treat missing method as GET
            if (url.includes(`/todos/${LIST_ID}`) && (!init || !init.method || init.method === 'GET')) {
                // GET /todos/:listId
                return getApiMockResponse([{ id: TODO_ID, listId: LIST_ID, title: 'Task A', state: 'TODO' }]);
            }

            if (url.includes(`/todos/${LIST_ID}/${TODO_ID}/transition`) && init?.method === 'POST') {
                return getApiMockResponse({ ok: true });
            }

            return getApiMockResponse({});
        });

        (global as any).fetch = fetchMock as any;

        render(
            <MemoryRouter initialEntries={[`/home/${LIST_ID}`]}>
                <Routes>
                    <Route path="/home/:listId" element={<HomePage />} />
                </Routes>
            </MemoryRouter>
        );

        // Wait for todo to render
        await screen.findByText(/Task A/i);

        // Click In Progress (forward from TODO) -> should send transitionItem: 'next'
        const forwardBtn = screen.getByText(/In Progress/);
        fireEvent.click(forwardBtn);

        await waitFor(() => {
            const calls = ((global as any).fetch as jest.Mock).mock.calls;
            const last = calls[calls.length - 1];
            expect(String(last[0])).toContain(`/todos/${LIST_ID}/${TODO_ID}/transition`);
            const body = JSON.parse((last[1] as RequestInit).body as string);
            expect(body).toEqual({ transitionItem: 'next' });
        });
    });

    test('Todo page loads and transitions forward with transitionItem payload', async () => {
        const fetchMock = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input);

            if (url.includes('/lists') && !url.includes('/todos/')) {
                return getApiMockResponse([{ id: LIST_ID, name: 'L', key: 'K' }]);
            }

            // Treat missing method as GET
            if (url.includes(`/todos/${LIST_ID}`) && (!init || !init.method || init.method === 'GET')) {
                return getApiMockResponse([{ id: TODO_ID, listId: LIST_ID, title: 'Task B', state: 'TODO' }]);
            }
            
            if (url.includes(`/todos/${LIST_ID}/${TODO_ID}/transition`) && init?.method === 'POST') {
                return getApiMockResponse({ ok: true });
            }
            
            return getApiMockResponse({});
        });
    
        (global as any).fetch = fetchMock as any;

        render(
            <MemoryRouter initialEntries={[`/todo/${LIST_ID}/${TODO_ID}`]}>
                <Routes>
                    <Route path="/todo/:listId/:todoId" element={<TodoItemView />} />
                </Routes>
            </MemoryRouter>
        );

        await screen.findByText(/Task B/i);

        // Move forward from TODO -> ONGOING
        const forwardBtn = screen.getByText(/In Progress/);
        fireEvent.click(forwardBtn);

        await waitFor(() => {
            const calls = ((global as any).fetch as jest.Mock).mock.calls;
            const last = calls[calls.length - 1];
            expect(String(last[0])).toContain(`/todos/${LIST_ID}/${TODO_ID}/transition`);
            const body = JSON.parse((last[1] as RequestInit).body as string);
            expect(body).toEqual({ transitionItem: 'next' });
        });
    });
});
