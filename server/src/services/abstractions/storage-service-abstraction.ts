import type { Storage } from '../../models/storage';

export interface IStorageService {
	getDB(): Storage;
	saveDB(mutator: (data: Storage) => Storage | void): Storage;
	resetDB(): void;
}