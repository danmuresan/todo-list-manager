import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';

// Ensure a temp DATA_DIR per test run
const TMP_DIR = path.join(process.cwd(), 'tmp-test-data');

describe('storage-service', () => {
    const OLD_ENV = process.env;
    beforeEach(() => {
        process.env = { ...OLD_ENV };
        // clean tmp dir
        fs.rmSync(TMP_DIR, { recursive: true, force: true });
        process.env.DATA_DIR = TMP_DIR;
        // resetModules not needed; tests import after setting env
    });
    afterEach(() => {
        fs.rmSync(TMP_DIR, { recursive: true, force: true });
        process.env = OLD_ENV;
    });

    test('initializes and persists data', async () => {
        const { storageService } = await import('../../src/services/storage-service');
        const first = storageService.getStorageData();
        expect(first.users).toEqual([]);
        expect(first.lists).toEqual([]);
        expect(first.todos).toEqual([]);

        const updated = storageService.updateStorageData((d) => {
            d.lists.push({ id: 'l1', name: 'Team', key: 'abcd', members: [] });
            return d;
        });
        expect(updated.lists.length).toBe(1);

        const second = storageService.getStorageData();
        expect(second.lists.length).toBe(1);

        storageService.resetStorageData();
        const reset = storageService.getStorageData();
        expect(reset.lists.length).toBe(0);
    });
});
