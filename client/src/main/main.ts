import { app, BrowserWindow, ipcMain, clipboard } from 'electron';
import fs from 'fs';
import { Channels } from '../shared/ipc';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

// Enable remote debugging for renderer processes so VS Code can attach
app.commandLine.appendSwitch('remote-debugging-port', '9222');

const createWindow = () => {
    const preloadPath = path.join(__dirname, 'preload.js');
    console.log('[Main] preload path:', preloadPath, 'exists?', fs.existsSync(preloadPath));
    mainWindow = new BrowserWindow({
        width: 460,
        height: 660,
        resizable: false,
        webPreferences: {
            preload: preloadPath,
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
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

const handleWindowBoundsForLoginStarted = () => {
    console.log('[Main] setupMainWindowBoundsForLogin received');
	if (!mainWindow) {
        return;
    }
    mainWindow.setResizable(false);
	mainWindow.setMinimumSize(460, 660);
    mainWindow.setSize(460, 660);
    mainWindow.center();
};

const handleWindowBoundsForLoginCompleted = () => {
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

const onWriteTextToClipboardRequested = (text: string) => {
    try {
        clipboard.writeText(text);
        console.log('[Main] clipboard.writeText success via IPC');
    } catch (err) {
        console.error('[Main] clipboard.writeText failed via IPC', err);
    }
};

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

// Listen via typed channel name
ipcMain.on(Channels.rendererToMainAsync.setupMainWindowBoundsForLogin, handleWindowBoundsForLoginStarted);
ipcMain.on(Channels.rendererToMainAsync.loginWindowCompleted, handleWindowBoundsForLoginCompleted);
ipcMain.on(Channels.rendererToMainAsync.writeClipboardText, (_ev, payload: unknown) => {
    console.log('[Main] writeClipboardText event received:', payload);
    const text = (payload && typeof payload === 'object' && 'text' in (payload as any))
        ? String((payload as any).text)
        : undefined;

    if (!text) {
        console.warn('[Main] writeClipboardText ignored: invalid payload', payload);
        return;
    }

    onWriteTextToClipboardRequested(text);
});
