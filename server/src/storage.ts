import { storageService, initialData } from './services/storage-service';

export { storageService as storage, initialData };
export { default as StorageService } from './services/storage-service';
// Test helper shim maintained for tests importing resetDB
export function resetDB(): void {
    storageService.resetDB();
}
