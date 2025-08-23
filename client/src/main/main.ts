import { app, BrowserWindow, ipcMain, screen } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 460,
    height: 660,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    mainWindow.loadURL(`${devUrl}`);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('setupMainWindowBoundsForLogin', () => {
  if (!mainWindow) return;
  mainWindow.setResizable(false);
  mainWindow.setSize(460, 660);
  mainWindow.center();
});

ipcMain.on('loginWindowCompleted', () => {
  if (!mainWindow) return;
  mainWindow.setResizable(true);
  const { workArea } = screen.getPrimaryDisplay();
  mainWindow.setBounds(workArea);
});
