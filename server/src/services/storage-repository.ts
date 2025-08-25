import type { IStorageService } from './abstractions/storage-service-abstraction';
import type { IRepository } from './abstractions/repository-abstraction';
import type { Storage } from '../models/storage';

/**
 * Generic repository for managing storage data for a specific entity type.
 * Used for CRUD operations on the entity type.
 * @template T entity type that's being managed, must have an 'id' property.
 */
export class StorageRepository<T extends { id: string }> implements IRepository<T> {
    private readonly storage: IStorageService;
    private readonly getCollection: (db: Storage) => T[];

    constructor(storage: IStorageService, getCollection: (db: Storage) => T[]) {
        this.storage = storage;
        this.getCollection = getCollection;
    }

    getAll(): T[] {
        const db = this.storage.getStorageData();
        return [...this.getCollection(db)];
    }

    getById(id: string): T | undefined {
        const db = this.storage.getStorageData();
        const coll = this.getCollection(db);
        return coll.find((e) => e.id === id);
    }

    add(entity: T): void {
        this.storage.updateStorageData((data) => {
            const coll = this.getCollection(data) as T[];
            coll.push(entity);
            return data;
        });
    }

    update(updateFn: (entity: T) => void, predicate?: (e: T) => boolean): void {
        this.storage.updateStorageData((data) => {
            const coll = this.getCollection(data) as T[];
            if (predicate) {
                coll.forEach((e) => { if (predicate(e)) updateFn(e); });
            } else {
                coll.forEach((e) => updateFn(e));
            }
            return data;
        });
    }

    removeById(id: string): boolean {
        let removed = false;
        this.storage.updateStorageData((data) => {
            const coll = this.getCollection(data) as T[];
            const idx = coll.findIndex((e) => e.id === id);
            if (idx !== -1) {
                coll.splice(idx, 1);
                removed = true;
            }
            return data;
        });
        return removed;
    }
}
