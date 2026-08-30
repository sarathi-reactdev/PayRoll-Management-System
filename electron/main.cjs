const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// Configure auto-updater
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: "iMatrix Technology Solutions — Payroll Management System",
    icon: path.join(__dirname, '../public/icon.png'),
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
      autoUpdater.checkForUpdates();
    }
  });
}

// Auto-Updater Event Listeners
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for updates from GitHub...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info.version);
  // Notify the user that download has started
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Found',
    message: `Version ${info.version} is available!`,
    detail: 'The update is currently downloading in the background. You will be prompted once it is ready to install.',
    buttons: ['OK']
  });
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded successfully:', info.version);
  dialog.showMessageBox({
    type: 'question',
    title: 'Update Ready to Install',
    message: `Version ${info.version} has been downloaded.`,
    detail: 'Would you like to restart the application now to install the new version?',
    buttons: ['Restart & Install Now', 'Install on Exit'],
    defaultId: 0,
    cancelId: 1
  }).then((returnValue) => {
    if (returnValue.response === 0) {
      // Force exit and run the new installer, then relaunch app
      setImmediate(() => {
        autoUpdater.quitAndInstall(false, true);
      });
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
