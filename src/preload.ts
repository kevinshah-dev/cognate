// src/preload.ts

import { contextBridge, ipcRenderer } from "electron";

// The "contextBridge" is a secure way to expose APIs from the preload script
// to the renderer process. The renderer can then access these APIs via
// `window.electronAPI`.

contextBridge.exposeInMainWorld("electronAPI", {
  // We are exposing a function called `getElectronVersion`.
  // This function will send a message to the main process
  // over the 'get-electron-version' channel and return the response.
  getElectronVersion: () => ipcRenderer.invoke("get-electron-version"),
  invoke: (channel: string, ...args: any[]) =>
    ipcRenderer.invoke(channel, ...args),

  getApiKeys: () => ipcRenderer.invoke("get-api-keys"),
  setApiKeys: (keys: Record<string, string>) =>
    ipcRenderer.invoke("set-api-keys", keys),

  listHistory: () => ipcRenderer.invoke("history:list"),
  addHistory: (entry: {
    text: string;
    providers: string[];
    attachmentNames?: string[];
  }) => ipcRenderer.invoke("history:add", entry),
  deleteHistory: (id: string) => ipcRenderer.invoke("history:delete", id),
  clearHistory: () => ipcRenderer.invoke("history:clear"),
});
