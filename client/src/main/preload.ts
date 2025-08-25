import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
// Preload startup log to ensure this script actually runs
console.log('[Preload] script loaded');
import type { RendererToMainAsync, MainToRenderer, RendererAPI } from '../shared/ipc';

type ExposedAPI = RendererAPI<RendererToMainAsync> & {
  on<K extends keyof MainToRenderer>(channel: K, listener: (payload: MainToRenderer[K]) => void): () => void;
};

const CHANNELS = {
    setupMainWindowBoundsForLogin: 'setupMainWindowBoundsForLogin',
    loginWindowCompleted: 'loginWindowCompleted'
} as const;

const api: ExposedAPI = {
    setupMainWindowBoundsForLogin: () => {
        console.log('[Renderer] setupMainWindowBoundsForLogin -> send');
        ipcRenderer.send(CHANNELS.setupMainWindowBoundsForLogin);
    },
    loginWindowCompleted: () => {
        console.log('[Renderer] loginWindowCompleted -> send');
        ipcRenderer.send(CHANNELS.loginWindowCompleted);
        // safety net in case of channel mismatch
        ipcRenderer.send('loginWindowCompleted');
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
