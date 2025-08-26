export {};

import type { RendererToMainAsync, MainToRenderer, RendererAPI } from '../../shared/ipc';

type RendererBridge = RendererAPI<RendererToMainAsync> & {
  on<K extends keyof MainToRenderer>(channel: K, listener: (payload: MainToRenderer[K]) => void): () => void;
  setupMainWindowBoundsForLogin: () => void;
  loginWindowCompleted: () => void;
  writeClipboardText: ({ text: string }) => void;
};

declare global {
  interface Window {
    electronAPI?: RendererBridge;
  }
}
