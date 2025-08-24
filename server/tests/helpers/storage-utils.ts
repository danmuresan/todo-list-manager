import { storageService, initialData } from '../../src/services/storage-service';
export { storageService as storage, initialData };
export { default as StorageService } from '../../src/services/storage-service';

/**
 * Test helper shim maintained for tests importing resetDB
 */
export function resetDB(): void {
    storageService.resetDB();
}
