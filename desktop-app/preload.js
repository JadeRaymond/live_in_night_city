const { contextBridge, ipcRenderer } = require('electron');

// Expose a secure API to the renderer process
contextBridge.exposeInMainWorld('api', {
  // Each function sends a message (invokes a channel) to the main process
  // and returns a promise that resolves with the main process's reply.

  getTasks: () => ipcRenderer.invoke('get-tasks'),

  addTask: (task) => ipcRenderer.invoke('add-task', task),

  updateTask: (taskId, updates) => ipcRenderer.invoke('update-task', taskId, updates),

  deleteTask: (taskId) => ipcRenderer.invoke('delete-task', taskId)
});
