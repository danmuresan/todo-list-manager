import fs from 'fs';
import path from 'path';
import type { Storage } from '../models/storage';
import type { IStorageService } from './abstractions/storage-service-abstraction';
import { logger } from './logger';

const DATA_DIR: string = process.env.DATA_DIR || path.join(process.cwd(), 'src', 'data');
const DB_PATH: string = path.join(DATA_DIR, 'db.json');

/**
 * Initial data for the storage.
 */
export const initialData: Storage = {
    users: [],
    lists: [],
    todos: [],
};

/**
 * Storage service for managing application data.
 */
class StorageService implements IStorageService {
    public getStorageData(): Storage {
        return this.readDataFromStorage();
    }

    public updateStorageData(mutator: (data: Storage) => Storage | void): Storage {
        const data = this.readDataFromStorage();
        const newData = (mutator(data) as Storage) || data;
        this.writeDataToStorage(newData);
        return newData;
    }

    public resetStorageData(): void {
        this.writeDataToStorage({ ...initialData });
    }

    private ensureDir(dir: string): void {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    private readDataFromStorage(): Storage {
        this.ensureDir(DATA_DIR);
        if (!fs.existsSync(DB_PATH)) {
            fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
            return { ...initialData };
        }
        const content: string = fs.readFileSync(DB_PATH, 'utf-8');
        try {
            return JSON.parse(content || '{}') as Storage;
        } catch (err) {
            logger.error?.('[StorageService] JSON parse error:', (err as Error).message);
            return { ...initialData };
        }
    }

    private writeDataToStorage(data: Storage): void {
        this.ensureDir(DATA_DIR);
        const tmp = DB_PATH + '.tmp';
        fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
        fs.renameSync(tmp, DB_PATH);
    }
}

export const storageService = new StorageService();
