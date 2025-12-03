import { app, shell, BrowserWindow, ipcMain, dialog, session } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import Store from 'electron-store'

const store = new Store();

app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-gpu-program-cache');
try {
  const userData = app.getPath('userData');
  app.commandLine.appendSwitch('disk-cache-dir', join(userData, 'Cache'));
} catch {}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // --- KRİTİK DÜZELTME: YAZDIRMA PENCERESİ İZNİ ---
  mainWindow.webContents.setWindowOpenHandler((details) => {
    // Eğer adres "about:blank" ise (Yazdırma penceresi), uygulamanın içinde açılmasına İZİN VER
    if (details.url === 'about:blank') {
      return { action: 'allow' }
    }
    
    // Diğer linkleri (google.com vb.) tarayıcıda aç
    shell.openExternal(details.url)
    return { action: 'deny' }
  })
  // ------------------------------------------------

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.alfa.erp')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Veritabanı İletişimi
  ipcMain.on('db-set', (event, key, value) => store.set(key, value));
  ipcMain.handle('db-get', (event, key) => store.get(key));
  ipcMain.on('db-delete', (event, key) => store.delete(key));

  ipcMain.handle('clear-cache', async () => {
    try {
      const ses = session.defaultSession;
      await ses.clearCache();
      await ses.clearStorageData({ storages: ['appcache','serviceworkers','caches','localstorage','indexeddb','cookies'] });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: String(e && e.message ? e.message : e) };
    }
  });

  ipcMain.handle('save-text-file', async (event, payload) => {
    const { content, filename, filters } = payload || {};
    const parent = BrowserWindow.fromWebContents(event.sender);
    try {
      const { canceled, filePath } = await dialog.showSaveDialog(parent, {
        title: 'Dosya kaydet',
        defaultPath: filename || 'dosya.txt',
        filters: Array.isArray(filters) ? filters : [{ name: 'Tüm Dosyalar', extensions: ['*'] }]
      });
      if (canceled || !filePath) return { ok: false, error: 'canceled' };
      const fs = await import('fs/promises');
      await fs.writeFile(filePath, String(content || ''));
      return { ok: true, path: filePath };
    } catch (e) {
      return { ok: false, error: String(e && e.message ? e.message : e) };
    }
  });

  ipcMain.handle('open-text-file', async (event, payload) => {
    const { filters } = payload || {};
    const parent = BrowserWindow.fromWebContents(event.sender);
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog(parent, {
        title: 'Dosya aç',
        properties: ['openFile'],
        filters: Array.isArray(filters) ? filters : [{ name: 'Tüm Dosyalar', extensions: ['*'] }]
      });
      if (canceled || !filePaths || !filePaths[0]) return { ok: false, error: 'canceled' };
      const fs = await import('fs/promises');
      const content = await fs.readFile(filePaths[0], 'utf-8');
      return { ok: true, path: filePaths[0], content };
    } catch (e) {
      return { ok: false, error: String(e && e.message ? e.message : e) };
    }
  });

  // PDF Yazdırma
  ipcMain.handle('print-to-pdf', async (event, payload) => {
    const { html, filename, options } = payload || {};
    const parent = BrowserWindow.fromWebContents(event.sender);
    const bw = new BrowserWindow({
      show: false,
      webPreferences: { sandbox: true }
    });
    try {
      await bw.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html || '<html><body></body></html>'));
      const pdf = await bw.webContents.printToPDF({ printBackground: true, marginsType: 0, landscape: false, ...options });
      const { canceled, filePath } = await dialog.showSaveDialog(parent, {
        title: 'PDF olarak kaydet',
        defaultPath: filename || 'dosya.pdf',
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
      });
      if (canceled || !filePath) return { ok: false, error: 'canceled' };
      const fs = await import('fs/promises');
      await fs.writeFile(filePath, pdf);
      return { ok: true, path: filePath };
    } catch (err) {
      return { ok: false, error: String(err && err.message ? err.message : err) };
    } finally {
      bw.destroy();
    }
  });

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
