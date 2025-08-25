import { describe, test, expect } from '@jest/globals';
import { StorageRepository } from '../../src/services/storage-repository';
import type { IStorageService } from '../../src/services/abstractions/storage-service-abstraction';
import type { Storage } from '../../src/models/storage';
import type { TodoItem, TodoItemState } from '../../src/models/todo-item';
import type { TodoList } from '../../src/models/todo-list';

function createInMemoryStorage(initial?: Partial<Storage>): IStorageService {
    let db: Storage = {
        users: [],
        lists: [],
        todos: [],
        ...initial,
    } as Storage;

    return {
        getStorageData: () => ({ ...db, users: [...db.users], lists: [...db.lists], todos: [...db.todos] }),
        updateStorageData: (mutator) => {
            const next = (mutator(db) as Storage) || db;
            db = next;
            return db;
        },
        resetStorageData: () => { db = { users: [], lists: [], todos: [] } as Storage; },
    };
}

describe('StorageRepository', () => {
    test('manages TodoItem entities', () => {
        const storage = createInMemoryStorage();
        const repo = new StorageRepository<TodoItem>(storage, (db) => db.todos);

        const item: TodoItem = {
            id: 't1', listId: 'l1', title: 'Task', state: 'TODO' as TodoItemState, createdBy: 'u1', updatedAt: new Date().toISOString(),
        };
        repo.add(item);
        expect(repo.getById('t1')?.title).toBe('Task');
        expect(repo.getAll().length).toBe(1);

        repo.update((e) => { e.title = 'Updated'; }, (e) => e.id === 't1');
        expect(repo.getById('t1')?.title).toBe('Updated');

        const removed = repo.removeById('t1');
        expect(removed).toBe(true);
        expect(repo.getAll().length).toBe(0);
    });

    test('manages TodoList entities', () => {
        const storage = createInMemoryStorage();
        const repo = new StorageRepository<TodoList>(storage, (db) => db.lists);

        const list: TodoList = { id: 'l1', name: 'Team', key: 'abcd', members: [] };
        repo.add(list);
        expect(repo.getById('l1')?.name).toBe('Team');

        repo.update((l) => { if (!l.members.includes('u1')) l.members.push('u1'); }, (l) => l.id === 'l1');
        expect(repo.getById('l1')?.members.includes('u1')).toBe(true);
    });
});
