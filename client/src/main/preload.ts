import { contextBridge, ipcRenderer, clipboard } from 'electron';
import { type RendererToMainAsync, type RendererAPI, Channels } from '../shared/ipc';

console.log('[Preload] script loaded');

const api: RendererAPI<RendererToMainAsync> = {
    setupMainWindowBoundsForLogin: () => {
        console.log('[Renderer] setupMainWindowBoundsForLogin -> send');
        ipcRenderer.send(Channels.rendererToMainAsync.setupMainWindowBoundsForLogin);
    },
    loginWindowCompleted: () => {
        console.log('[Renderer] loginWindowCompleted -> send');
        ipcRenderer.send(Channels.rendererToMainAsync.loginWindowCompleted);
    },
    writeClipboardText: (payload: { text: string }) => {
        try {
            console.log('[Preload] clipboard.writeText invoked');
            clipboard.writeText(payload.text);
            console.log('[Preload] clipboard.writeText success');
        } catch (err) {
            console.error('[Preload] clipboard.writeText failed, falling back to IPC', err);
            try {
                ipcRenderer.send(Channels.rendererToMainAsync.writeClipboardText, payload);
            } catch (ipcErr) {
                console.error('[Preload] IPC clipboard fallback failed', ipcErr);
            }
        }
    }
};

try {
    contextBridge.exposeInMainWorld('electronAPI', api);
    console.log('[Preload] electronAPI exposed');
} catch (err) {
    console.error('[Preload] exposeInMainWorld failed', err);
}
