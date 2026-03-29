const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let mainWindow;
let backendProcess;

// Path to backend executable
const backendPath = path.join(
  __dirname,
  'backend',
  'dist',
  'KEC_Routine_Backend',
  'KEC_Routine_Backend.exe'
);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, 'icon.ico'),
    title: 'Routine Scheduler'
  });

  // Wait for backend to start then load frontend
  setTimeout(() => {
    mainWindow.loadFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
  }, 3000);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

function startBackend() {
  console.log('Starting backend server...');
  console.log('Backend path:', backendPath);

  backendProcess = spawn(backendPath, [], {
    cwd: path.dirname(backendPath),
    stdio: 'inherit'
  });

  backendProcess.on('error', (err) => {
    console.error('Failed to start backend:', err);
  });

  backendProcess.on('exit', (code) => {
    console.log(`Backend exited with code ${code}`);
  });
}

app.on('ready', () => {
  startBackend();
  createWindow();
});

app.on('window-all-closed', function () {
  if (backendProcess) {
    backendProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});
