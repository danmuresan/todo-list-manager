export {};

declare global {
  interface Window {
    electronAPI?: {
      setupMainWindowBoundsForLogin: () => void;
      loginWindowCompleted: () => void;
    };
  }
}
