const { app, BrowserWindow, dialog, shell } = require('electron');
const path = require('node:path');
const { createServer } = require('../server/index.cjs');

let server;
let mainWindow;

async function start() {
  app.setAppUserModelId('br.olhodehorus.desktop');
  const dbPath = path.join(app.getPath('userData'), 'data', 'olho-de-horus.sqlite');
  server = await createServer({ dbPath, host: '127.0.0.1', port: 0, production: app.isPackaged });
  await server.listen();
  mainWindow = new BrowserWindow({
    width: 1440, height: 940, minWidth: 990, minHeight: 680,
    title: 'Olho de Hórus',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });
  await mainWindow.loadURL(server.url);
  if (!app.isPackaged) mainWindow.webContents.openDevTools({ mode: 'detach' });
}

app.whenReady().then(start).catch(async (error) => {
  dialog.showErrorBox('Olho de Hórus', `Não foi possível iniciar o aplicativo.\n${error.message}`);
  await app.quit();
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit', async (event) => {
  if (server) {
    event.preventDefault();
    const current = server;
    server = null;
    try { await current.close(); } finally { app.exit(0); }
  }
});
