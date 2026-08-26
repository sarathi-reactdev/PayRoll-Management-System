const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// Configure auto-updater logging
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: "iMatrix Technology Solutions — Payroll Management System",
    icon: path.join(__dirname, '../public/imatrix-logo.svg'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  win.loadFile(path.join(__dirname, '../dist/index.html'));
  win.setMenuBarVisibility(false);

  // Check for updates after the window is fully loaded
  win.once('ready-to-show', () => {
    // Only check for updates in packaged production builds
    if (app.isPackaged) {
      autoUpdater.checkForUpdatesAndNotify();
    }
  });
}

// Auto-Updater Event Listeners
autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info.version);
});

autoUpdater.on('update-downloaded', (info) => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Software Update Ready',
    message: `A new version (v${info.version}) has been downloaded!`,
    detail: 'Restart the application now to apply the latest updates and improvements.',
    buttons: ['Restart and Update', 'Later'],
    defaultId: 0,
    cancelId: 1
  }).then((returnValue) => {
    if (returnValue.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

autoUpdater.on('error', (err) => {
  console.error('Error during update check:', err);
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});