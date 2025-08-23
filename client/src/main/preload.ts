import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import type { RendererToMainAsync, MainToRenderer } from '../shared/ipc';
import { Channels } from '../shared/ipc';
import type { RendererAPI } from '../shared/ipc';

type ExposedAPI = RendererAPI<RendererToMainAsync> & {
  on<K extends keyof MainToRenderer>(channel: K, listener: (payload: MainToRenderer[K]) => void): () => void;
};

const api: ExposedAPI = {
  setupMainWindowBoundsForLogin: () => ipcRenderer.send(Channels.rendererToMainAsync.setupMainWindowBoundsForLogin),
  loginWindowCompleted: () => ipcRenderer.send(Channels.rendererToMainAsync.loginWindowCompleted),
  on: (channel, listener) => {
    const wrapped = (_ev: IpcRendererEvent, payload: unknown) => {
      listener(payload as any);
    };
    ipcRenderer.on(channel as string, wrapped);
    return () => ipcRenderer.removeListener(channel as string, wrapped);
  }
};

contextBridge.exposeInMainWorld('electronAPI', api);
