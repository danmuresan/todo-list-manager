import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  setupMainWindowBoundsForLogin: () => ipcRenderer.send('setupMainWindowBoundsForLogin'),
  loginWindowCompleted: () => ipcRenderer.send('loginWindowCompleted')
});
