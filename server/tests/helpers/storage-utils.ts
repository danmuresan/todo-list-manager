import { storageService, initialData } from '../../src/services/storage-service';
export { storageService as storage, initialData };

/**
 * Test helper shim maintained for tests importing resetDB
 */
export function resetDB(): void {
    storageService.resetStorageData();
}
    