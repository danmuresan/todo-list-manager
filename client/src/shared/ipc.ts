// Shared IPC typings between renderer and main
// Extend these mappings as your app grows

/**
 * Renderer→Main (async fire-and-forget).
 *
 * Use this map for one-way signals where the renderer tells the main process to do something
 * and does not expect an immediate return value.
 *
 * Transport: `ipcRenderer.send(channel, payload?)` on the renderer and `ipcMain.on(channel, handler)` on main.
 *
 * Value shape:
 * - `void` → no payload (just a signal)
 * - `{...}` → typed payload object is required
 *
 * Example:
 * - `createList: { name: string }` lets you call `electronAPI.createList({ name: 'My List' })`.
 */
export interface RendererToMainAsync {
  setupMainWindowBoundsForLogin: void;
  loginWindowCompleted: void;
  // createList: { name: string };
}

/**
 * Renderer→Main (promise-based request/response).
 *
 * Use this map for calls where the renderer asks main for a result and awaits a Promise.
 *
 * Transport: `ipcRenderer.invoke(channel, request)` on renderer and `ipcMain.handle(channel, handler)` on main.
 *
 * Entry schema:
 * - `{ request: R; response: S }` where `R` is the request payload type and `S` is the response type.
 *
 * Example:
 * - `getVersion: { request: void; response: string }` lets you call `const v = await electronAPI.getVersion()`.
 */
export interface RenderToMainPromise {
  // getVersion: { request: void; response: string };
}

/**
 * Main→Renderer broadcasts using `webContents.send` / `ipcRenderer.on`.
 *
 * Define channels here to type main-to-renderer push messages.
 */
export interface MainToRenderer {
  // showNotification: { message: string };
}

// Utility helpers to keep mapped types readable
// SendFn<void> => () => void
// SendFn<{ x: number }> => (payload: { x: number }) => void
type SendFn<T> = T extends void ? () => void : (payload: T) => void;

// InvokeFnFor<{ request: R; response: S }> => (payload: R) => Promise<S>
type InvokeFnFor<T> = T extends { request: infer R; response: infer S }
  ? (payload: R) => Promise<S>
  : never;

// Utility mapped types
// Example: RendererAPI<{ ping: void; create: { name: string } }>
// becomes: { ping: () => void; create: (payload: { name: string }) => void }
export type RendererAPI<M extends object> = {
  [K in keyof M]: SendFn<M[K]>;
};

// Example: RendererInvokeAPI<{ getVersion: { request: void; response: string } }>
// becomes: { getVersion: () => Promise<string> }
export type RendererInvokeAPI<M> = {
  [K in keyof M]: InvokeFnFor<M[K]>;
};

/**
 * Centralized channel names to avoid repeating string literals across main/renderer.
 *
 * Typed once using `satisfies` so keys stay in sync with interface maps.
 * Consumers should import and use these instead of raw strings.
 */
export const Channels = {
    rendererToMainAsync: {
        setupMainWindowBoundsForLogin: 'setupMainWindowBoundsForLogin',
        loginWindowCompleted: 'loginWindowCompleted'
    	// createList: 'createList'
    },
    renderToMainPromise: {
    	// getVersion: 'getVersion'
    },
    mainToRenderer: {
    	// showNotification: 'showNotification'
    }
} as const satisfies {
  rendererToMainAsync: Record<keyof RendererToMainAsync, string>;
  renderToMainPromise: Record<keyof RenderToMainPromise, string>;
  mainToRenderer: Record<keyof MainToRenderer, string>;
};
