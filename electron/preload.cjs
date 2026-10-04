const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("krilly", {
  createRealtimeToken: () => ipcRenderer.invoke("realtime:create-token"),
  executeTool: (toolCall) => ipcRenderer.invoke("tools:execute", toolCall),
  executeLocalCommand: (text) => ipcRenderer.invoke("local:command", text),
  getToolSpecs: () => ipcRenderer.invoke("tools:list"),
  readScreenImage: (screenshotPath) => ipcRenderer.invoke("screen:read-image", screenshotPath),
  startWakeWord: () => ipcRenderer.invoke("wake-word:start"),
  stopWakeWord: () => ipcRenderer.invoke("wake-word:stop"),
  onWakeWord: (callback) => {
    const handler = () => callback();
    ipcRenderer.on("wake-word:detected", handler);
    return () => ipcRenderer.removeListener("wake-word:detected", handler);
  },
  onWakeWordError: (callback) => {
    const handler = (_event, message) => callback(message);
    ipcRenderer.on("wake-word:error", handler);
    return () => ipcRenderer.removeListener("wake-word:error", handler);
  },
});
