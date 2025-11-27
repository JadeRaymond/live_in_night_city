// Note: No 'require' statements here!
// This script runs in the browser-like environment of the renderer process.
// It communicates with the main process via the secure API exposed in preload.js.

document.addEventListener('DOMContentLoaded', () => {
    const taskTitleInput = document.getElementById('task-title');
    const taskContentInput = document.getElementById('task-content');
    const addTaskBtn = document.getElementById('add-task-btn');

    const columns = {
        'new': document.getElementById('new-tasks'),
        'in-progress': document.getElementById('inprogress-tasks'),
        'done': document.getElementById('done-tasks')
    };

    // --- Function to update a task's status ---
    const updateTaskStatus = async (taskId, newStatus) => {
        const result = await window.api.updateTask(taskId, { status: newStatus });
        if (result.error) {
            console.error(`Error updating task ${taskId}:`, result.error);
            alert('Failed to update task status.');
        } else {
            fetchTasks(); // Refresh the board
        }
    };

    // --- Function to render tasks ---
    const renderTasks = (tasks) => {
        // Clear columns
        Object.values(columns).forEach(col => {
            const header = col.querySelector('h2').outerHTML;
            col.innerHTML = header;
        });

        if (!tasks || tasks.length === 0) return;

        tasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = 'task';
            taskElement.dataset.id = task.id;

            const statusSelector = `
                <select class="status-selector" data-task-id="${task.id}">
                    <option value="new" ${task.status === 'new' ? 'selected' : ''}>New</option>
                    <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                    <option value="done" ${task.status === 'done' ? 'selected' : ''}>Done</option>
                </select>
            `;

            taskElement.innerHTML = `
                <h4>${task.title}</h4>
                <p>${task.content ? task.content.substring(0, 100) + '...' : ''}</p>
                ${statusSelector}
            `;

            if (columns[task.status]) {
                columns[task.status].appendChild(taskElement);
            }
        });

        // Add event listeners to dropdowns
        document.querySelectorAll('.status-selector').forEach(selector => {
            selector.addEventListener('change', (event) => {
                const taskId = event.target.dataset.taskId;
                const newStatus = event.target.value;
                updateTaskStatus(taskId, newStatus);
            });
        });
    };

    // --- Function to fetch tasks ---
    const fetchTasks = async () => {
        const tasks = await window.api.getTasks();
        if (tasks.error) {
            console.error('Error fetching tasks:', tasks.error);
            alert('Failed to fetch tasks. Is the backend server running?');
        } else {
            renderTasks(tasks);
        }
    };

    // --- Function to add a new task ---
    const addTask = async () => {
        const title = taskTitleInput.value.trim();
        const content = taskContentInput.value.trim();

        if (!title) {
            alert('Task title is required.');
            return;
        }

        const result = await window.api.addTask({ title, content });
        if (result.error) {
            console.error('Error adding task:', result.error);
            alert('Failed to add task.');
        } else {
            taskTitleInput.value = '';
            taskContentInput.value = '';
            fetchTasks();
        }
    };

    // --- Event Listeners ---
    addTaskBtn.addEventListener('click', addTask);

    // Initial fetch
    fetchTasks();
});
