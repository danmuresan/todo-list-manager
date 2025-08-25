import type { Storage } from '../../models/storage';

/**
 * Storage service interface for managing data storage.
 */
export interface IStorageService {
    /**
     * Get the current database information.
     */
	getStorageData(): Storage;

    /**
     * Save the new database information.
     */
	updateStorageData(mutator: (data: Storage) => Storage | void): Storage;

    /**
     * Reset the database to its initial state.
     */
	resetStorageData(): void;
}