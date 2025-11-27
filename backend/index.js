const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');

// --- Database Setup ---
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite' // This file will be created in the 'backend' directory
});

// Define the Task model
const Task = sequelize.define('Task', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'new' // e.g., 'new', 'in-progress', 'done'
  }
});

// Sync database
sequelize.sync().then(() => {
  console.log('Database & tables created!');
});

// --- Express App Setup ---
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

app.get('/', (req, res) => {
  res.send('Task Tracker API (Local DB) is running!');
});

// --- API Endpoints for Tasks ---

// Get all tasks
app.get('/tasks', async (req, res) => {
  try {
    const tasks = await Task.findAll({ order: [['createdAt', 'DESC']] });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Create a new task
app.post('/tasks', async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const newTask = await Task.create({ title, content, status: 'new' });
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Update a task (e.g., change its status)
app.put('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, status } = req.body;

    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Update specified fields
    task.title = title ?? task.title;
    task.content = content ?? task.content;
    task.status = status ?? task.status;

    await task.save();
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Delete a task
app.delete('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByPk(id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await task.destroy();
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
