import fs from 'fs';
import path from 'path';
import type { Storage } from '../models/storage';
import type { IStorageService } from './abstractions/storage-service-abstraction';

const DATA_DIR: string = process.env.DATA_DIR || path.join(process.cwd(), 'src', 'data');
const DB_PATH: string = path.join(DATA_DIR, 'db.json');

export const initialData: Storage = {
    users: [],
    lists: [],
    todos: [],
};

class StorageService implements IStorageService {
    private ensureDir(dir: string): void {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    private readDB(): Storage {
        this.ensureDir(DATA_DIR);
        if (!fs.existsSync(DB_PATH)) {
            fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
            return { ...initialData };
        }
        const content: string = fs.readFileSync(DB_PATH, 'utf-8');
        try {
            return JSON.parse(content || '{}') as Storage;
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('[StorageService] JSON parse error:', (err as Error).message);
            return { ...initialData };
        }
    }

    private writeDB(data: Storage): void {
        this.ensureDir(DATA_DIR);
        const tmp = DB_PATH + '.tmp';
        fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
        fs.renameSync(tmp, DB_PATH);
    }

    public getDB(): Storage {
        return this.readDB();
    }

    public saveDB(mutator: (data: Storage) => Storage | void): Storage {
        const data = this.readDB();
        const newData = (mutator(data) as Storage) || data;
        this.writeDB(newData);
        return newData;
    }

    public resetDB(): void {
        this.writeDB({ ...initialData });
    }
}

export const storageService = new StorageService();
export default StorageService;

