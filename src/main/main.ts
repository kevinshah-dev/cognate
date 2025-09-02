// src/main/main.ts
import { app, BrowserWindow, ipcMain } from 'electron';
import keytar from 'keytar';
import { registerApiHandlers } from './api';

let mainWindow: BrowserWindow | null = null;

const SERVICE = 'cognate'; // shows up in Keychain / Credential Manager
const KNOWN_ACCOUNTS = ['openai', 'anthropic', 'google', 'deepseek'] as const;

ipcMain.handle('get-electron-version', () => `Electron: ${process.versions.electron}`);

ipcMain.handle('get-api-keys', async () => {
  await app.whenReady();
  const [openai, anthropic, google, deepseek] = await Promise.all([
    keytar.getPassword(SERVICE, 'openai'),
    keytar.getPassword(SERVICE, 'anthropic'),
    keytar.getPassword(SERVICE, 'google'),
    keytar.getPassword(SERVICE, 'deepseek'),
  ]);
  return {
    openai: openai ?? '',
    anthropic: anthropic ?? '',
    google: google ?? '',
    deepseek: deepseek ?? '',
  };
});

ipcMain.handle('set-api-keys', async (_event, keys: Record<string, string>) => {
  await app.whenReady();

  // Set when value is non-empty, delete when empty
  await Promise.all(
    Object.entries(keys).map(async ([account, value]) => {
      if (!KNOWN_ACCOUNTS.includes(account as any)) return;
      if (value && value.trim()) {
        await keytar.setPassword(SERVICE, account, value.trim());
      } else {
        // remove if cleared
        await keytar.deletePassword(SERVICE, account);
      }
    })
  );

  return { success: true };
});

const getApiKey = (providerId: string) => keytar.getPassword(SERVICE, providerId);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: { preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY },
  });
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  mainWindow.webContents.openDevTools();
  mainWindow.on('closed', () => (mainWindow = null));
}

app.whenReady().then(() => {
  // If your other API adapters need keys, they can read them on-demand with keytar, too.
  registerApiHandlers(getApiKey); // if you previously passed a store, you can pass anything or adjust usage
  createWindow();
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
