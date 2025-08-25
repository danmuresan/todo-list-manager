import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import SseService from '../../src/services/sse-service';

function createMockResponse() {
    const writes: string[] = [];
    const res: any = {
        write: jest.fn((chunk: string) => { writes.push(chunk); }),
        on: jest.fn(),
    };
    return { res, writes };
}

describe('SseService', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    test('subscribe writes connected comment and pings', () => {
        const sse = new SseService({ error: jest.fn(), info: jest.fn() } as any);
        const { res, writes } = createMockResponse();
        sse.subscribe('list1', res);
        expect(writes.join('')).toContain(': connected');

        jest.advanceTimersByTime(25000);
        expect(writes.join('')).toContain('event: ping');
    });

    test('broadcast sends events to subscribed clients', () => {
        const sse = new SseService({ error: jest.fn(), info: jest.fn() } as any);
        const { res, writes } = createMockResponse();
        sse.subscribe('list1', res);
        sse.broadcast('list1', 'todoCreated', { id: 't1' });
        const output = writes.join('');
        expect(output).toContain('event: todoCreated');
        expect(output).toContain('data: {"id":"t1"}');
    });
});
