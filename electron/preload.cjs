const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("krilly", {
  createRealtimeToken: () => ipcRenderer.invoke("realtime:create-token"),
  executeTool: (toolCall) => ipcRenderer.invoke("tools:execute", toolCall),
  getToolSpecs: () => ipcRenderer.invoke("tools:list"),
});
