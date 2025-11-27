const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios');

const API_URL = 'http://localhost:3001';

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // Correctly point to the preload script
      preload: path.join(__dirname, 'preload.js'),
      // Security settings
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  mainWindow.loadFile('index.html');
}

// --- IPC Handlers ---
// These handlers listen for events from the renderer process (via preload.js)
// and interact with the backend API.

// Get all tasks
ipcMain.handle('get-tasks', async () => {
  try {
    const response = await axios.get(`${API_URL}/tasks`);
    return response.data;
  } catch (error) {
    console.error('Error fetching tasks:', error.message);
    return { error: error.message };
  }
});

// Add a new task
ipcMain.handle('add-task', async (event, task) => {
  try {
    const response = await axios.post(`${API_URL}/tasks`, task);
    return response.data;
  } catch (error) {
    console.error('Error adding task:', error.message);
    return { error: error.message };
  }
});

// Update an existing task
ipcMain.handle('update-task', async (event, taskId, updates) => {
  try {
    const response = await axios.put(`${API_URL}/tasks/${taskId}`, updates);
    return response.data;
  } catch (error) {
    console.error(`Error updating task ${taskId}:`, error.message);
    return { error: error.message };
  }
});

// Delete a task
ipcMain.handle('delete-task', async (event, taskId) => {
  try {
    const response = await axios.delete(`${API_URL}/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting task ${taskId}:`, error.message);
    return { error: error.message };
  }
});


// --- App Lifecycle ---
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
