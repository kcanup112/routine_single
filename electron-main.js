// Electron desktop wrapper is currently DISABLED.
// The app runs as a web application via Docker (docker compose up).
// To re-enable, remove the early-return below.
console.log('Electron is disabled. Use "docker compose up" to run the app.');
if (typeof process !== 'undefined') process.exit(0);

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

  // Poll backend health endpoint instead of hard-coded wait
  const http = require('http');
  let attempts = 0;
  const maxAttempts = 30; // 30 * 500ms = 15s max wait
  
  function checkBackendReady() {
    attempts++;
    const req = http.get('http://localhost:8000/api/health', (res) => {
      if (res.statusCode === 200) {
        mainWindow.loadFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
      } else if (attempts < maxAttempts) {
        setTimeout(checkBackendReady, 500);
      } else {
        mainWindow.loadFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
      }
    });
    req.on('error', () => {
      if (attempts < maxAttempts) {
        setTimeout(checkBackendReady, 500);
      } else {
        mainWindow.loadFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
      }
    });
    req.end();
  }
  
  checkBackendReady();

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
