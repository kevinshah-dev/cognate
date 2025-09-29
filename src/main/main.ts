// src/main/main.ts
import { app, BrowserWindow, ipcMain } from "electron";
import { registerApiHandlers } from "./api";
import Store from "electron-store";
import { PromptEntry } from "../renderer/types";

let mainWindow: BrowserWindow | null = null;

const SERVICE = "cognate"; //Keychain / Credential Manager
const KNOWN_ACCOUNTS = ["openai", "anthropic", "google", "deepseek"] as const;

const keytar = require("keytar") as typeof import("keytar");

const historyStore = new Store<{ history: PromptEntry[] }>({
  name: "history",
  defaults: { history: [] },
});

ipcMain.handle("history:list", () => {
  const items = historyStore.get("history") || [];
  return [...items].sort((a, b) => b.createdAt - a.createdAt);
});

ipcMain.handle(
  "history:add",
  (_evt, entry: Omit<PromptEntry, "id" | "createdAt">) => {
    const items = historyStore.get("history") || [];
    const newItem: PromptEntry = {
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      createdAt: Date.now(),
      ...entry,
    };
    historyStore.set("history", [newItem, ...items].slice(0, 500)); // keep last 500
    return newItem;
  }
);

ipcMain.handle("history:delete", (_evt, id: string) => {
  const items = historyStore.get("history") || [];
  historyStore.set(
    "history",
    items.filter((h) => h.id !== id)
  );
  return { success: true };
});

ipcMain.handle("history:clear", () => {
  historyStore.set("history", []);
  return { success: true };
});

ipcMain.handle(
  "get-electron-version",
  () => `Electron: ${process.versions.electron}`
);

ipcMain.handle("get-api-keys", async () => {
  await app.whenReady();
  const [openai, anthropic, google, deepseek] = await Promise.all([
    keytar.getPassword(SERVICE, "openai"),
    keytar.getPassword(SERVICE, "anthropic"),
    keytar.getPassword(SERVICE, "google"),
    keytar.getPassword(SERVICE, "deepseek"),
  ]);
  return {
    openai: openai ?? "",
    anthropic: anthropic ?? "",
    google: google ?? "",
    deepseek: deepseek ?? "",
  };
});

ipcMain.handle("set-api-keys", async (_event, keys: Record<string, string>) => {
  await app.whenReady();

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

const getApiKey = (providerId: string) =>
  keytar.getPassword(SERVICE, providerId);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: { preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY },
  });
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }
  mainWindow.on("closed", () => (mainWindow = null));
}

app.whenReady().then(() => {
  registerApiHandlers(getApiKey);
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
