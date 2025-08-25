import { app, BrowserWindow, ipcMain, clipboard } from 'electron';
import fs from 'fs';
import { Channels } from '../shared/ipc';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

// Enable remote debugging for renderer processes so VS Code can attach
app.commandLine.appendSwitch('remote-debugging-port', '9222');

function createWindow() {
    const preloadPath = path.join(__dirname, 'preload.js');
    console.log('[Main] preload path:', preloadPath, 'exists?', fs.existsSync(preloadPath));
    mainWindow = new BrowserWindow({
        width: 460,
        height: 660,
        resizable: false,
        webPreferences: {
            preload: preloadPath,
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    const devUrl = process.env.VITE_DEV_SERVER_URL;
    if (devUrl) {
        mainWindow.loadURL(`${devUrl}`);
    } else {
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow?.webContents.executeJavaScript('Boolean(window.electronAPI)')
            .then((hasApi: boolean) => {
                console.log('[Main] window.electronAPI present?', hasApi);
            })
            .catch(err => console.error('[Main] executeJavaScript error', err));
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.on(Channels.rendererToMainAsync.setupMainWindowBoundsForLogin, () => {
    if (!mainWindow) {
        return;
    }
    mainWindow.setResizable(false);
    mainWindow.setSize(460, 660);
    mainWindow.center();
});

const handleLoginCompleted = () => {
    if (!mainWindow) {
        return;
    }
    console.log('[Main] loginWindowCompleted received');
    mainWindow.setResizable(true);
    // Make the main window a bit wider so labels fit comfortably
    mainWindow.setMinimumSize(800, 600);
    mainWindow.setSize(960, 720);
    mainWindow.center();
};

// Listen via typed channel name
ipcMain.on(Channels.rendererToMainAsync.loginWindowCompleted, handleLoginCompleted);
// Also listen on raw string as a safety net (in case of channel mapping mismatch)
ipcMain.on('loginWindowCompleted', handleLoginCompleted);

// (no-op helpers currently)

// Clipboard fallback handler: allows renderer/preload to request a write when direct access fails
ipcMain.on('writeClipboardText', (_ev, text: unknown) => {
    if (typeof text !== 'string') {
        console.warn('[Main] writeClipboardText ignored: payload not a string');
        return;
    }
    try {
        clipboard.writeText(text);
        console.log('[Main] clipboard.writeText success via IPC');
    } catch (err) {
        console.error('[Main] clipboard.writeText failed via IPC', err);
    }
});
