const { app, BrowserWindow, session } = require("electron");
const path = require("path");

// Enable auto-reload for development
require('electron-reload')(__dirname, {
  electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
});

const startServer = require("./server/app");
const isMac = process.platform === "darwin";

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false,
    },
    autoHideMenuBar: true,
  });
// grant mo to gago
  // Grant camera permissions for this window
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    console.log('Window permission requested:', permission);
    callback(true);
  });

  mainWindow.loadFile(path.join(__dirname, "/pages/sessionpage/sessionPage.html"));
  mainWindow.maximize();
}

app.whenReady().then(() => {
  // Set up permission handler before creating windows
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    console.log('Permission requested:', permission);
    // Automatically grant all permissions
    callback(true);
  });

  // Also handle permission checks
  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    console.log('Permission check:', permission);
    return true;
  });

  startServer();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (!isMac) {
    app.quit();
  }
});