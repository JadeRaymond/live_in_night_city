const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');

// --- Database Setup ---
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite'
});

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
    defaultValue: 'new'
  }
});

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
    console.error('Error getting tasks:', error); // Added logging
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
    console.error('Error creating task:', error); // Added logging
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Update a task
app.put('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, status } = req.body;
    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    task.title = title ?? task.title;
    task.content = content ?? task.content;
    task.status = status ?? task.status;
    await task.save();
    res.status(200).json(task);
  } catch (error) {
    console.error(`Error updating task ${req.params.id}:`, error); // Added logging
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
    console.error(`Error deleting task ${req.params.id}:`, error); // Added logging
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
