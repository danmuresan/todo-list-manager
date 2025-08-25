import { contextBridge, ipcRenderer, IpcRendererEvent, clipboard } from 'electron';
// Preload startup log to ensure this script actually runs
console.log('[Preload] script loaded');
import type { RendererToMainAsync, MainToRenderer, RendererAPI } from '../shared/ipc';

type ExposedAPI = RendererAPI<RendererToMainAsync> & {
    on<K extends keyof MainToRenderer>(channel: K, listener: (payload: MainToRenderer[K]) => void): () => void;
    writeText: (text: string) => void;
};

const CHANNELS = {
    setupMainWindowBoundsForLogin: 'setupMainWindowBoundsForLogin',
    loginWindowCompleted: 'loginWindowCompleted',
	writeClipboardText: 'writeClipboardText'
} as const;

const api: ExposedAPI = {
    setupMainWindowBoundsForLogin: () => {
        console.log('[Renderer] setupMainWindowBoundsForLogin -> send');
        ipcRenderer.send(CHANNELS.setupMainWindowBoundsForLogin);
    },
    loginWindowCompleted: () => {
        console.log('[Renderer] loginWindowCompleted -> send');
        ipcRenderer.send(CHANNELS.loginWindowCompleted);
    },
    writeText: (text: string) => {
        try {
            console.log('[Preload] clipboard.writeText invoked');
            clipboard.writeText(text);
            console.log('[Preload] clipboard.writeText success');
        } catch (err) {
            console.error('[Preload] clipboard.writeText failed, falling back to IPC', err);
            try {
                ipcRenderer.send(CHANNELS.writeClipboardText, text);
            } catch (ipcErr) {
                console.error('[Preload] IPC clipboard fallback failed', ipcErr);
            }
        }
    },
    on: (channel, listener) => {
        const wrapped = (_ev: IpcRendererEvent, payload: unknown) => {
            listener(payload as MainToRenderer[typeof channel]);
        };
        ipcRenderer.on(channel as string, wrapped);
        return () => ipcRenderer.removeListener(channel as string, wrapped);
    }
};

try {
    contextBridge.exposeInMainWorld('electronAPI', api);
    console.log('[Preload] electronAPI exposed');
} catch (err) {
    console.error('[Preload] exposeInMainWorld failed', err);
}
