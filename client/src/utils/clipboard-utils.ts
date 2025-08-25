/** Clipboard helpers for the renderer. */
export function writeTextToClipboard(text: string): boolean {
    try {
        const api = (window as any).electronAPI;
        const available = !!(api && typeof api.writeText === 'function');
        if (available) {
            // Debug: trace clipboard usage in renderer
            console.log('[Renderer] writeTextToClipboard -> calling electronAPI.writeText');
            api.writeText(text);
            return true;
        }
        console.warn('[Renderer] writeTextToClipboard -> electronAPI.writeText not available');
        return false;
    } catch {
        console.error('[Renderer] writeTextToClipboard -> unexpected error');
        return false;
    }
}

/** Convenience helper to build a shareable invite string for a list. */
export function buildInviteText(listName: string, key: string, joinEndpoint: string): string {
    // Intentionally copy only the raw invite key
    return key;
}
