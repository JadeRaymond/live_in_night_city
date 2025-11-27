document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('weblog-form');
    const currentTableBody = document.querySelector('#current-weblog-table tbody');
    const completedTableBody = document.querySelector('#completed-weblog-table tbody');
    const exportJsonBtn = document.getElementById('export-json');
    const importJsonBtn = document.getElementById('import-json');
    const jsonFileInput = document.getElementById('json-file-input');
    const exportCsvBtn = document.getElementById('export-csv');

    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');

    const modal = document.getElementById('weblog-modal');
    const modalCloseBtn = modal.querySelector('.close-btn');
    const modalNameInput = document.getElementById('modal-name');
    const modalDescTextarea = document.getElementById('modal-desc');
    const modalLinkAnchor = document.getElementById('modal-link');
    const modalStatusSelect = document.getElementById('modal-status');
    const modalSolutionTextarea = document.getElementById('modal-solution');
    const modalFileInput = document.getElementById('modal-file-input');
    const modalFilelist = document.getElementById('modal-file-list');
    const modalMeetingDateInput = document.getElementById('modal-meeting-date');
    const modalSolutionDateInput = document.getElementById('modal-solution-date');
    const saveChangesBtn = document.getElementById('save-changes-btn');
    const newCommentTextarea = document.getElementById('modal-new-comment');
    const addCommentBtn = document.getElementById('add-comment-btn');
    const daysToResolveSpan = document.getElementById('days-to-resolve');

    const instructionsHeader = document.getElementById('instructions-header');
    const instructionsContent = document.getElementById('instructions-content');

    let allWeblogs = [];

    loadWeblogsFromLocalStorage();
    renderWeblogs();

    instructionsHeader.addEventListener('click', () => {
        instructionsContent.classList.toggle('collapsed');
        instructionsHeader.classList.toggle('collapsed');
    });
    instructionsContent.classList.add('collapsed');
    instructionsHeader.classList.add('collapsed');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const weblogIdInput = document.getElementById('weblog-id');
        const weblogId = weblogIdInput.value.trim();

        if (allWeblogs.some(w => w.id === weblogId)) {
            alert('A WEBLOG with this ID already exists. Please use a unique ID.');
            weblogIdInput.focus();
            return;
        }

        const now = new Date();
        const newWeblog = {
            id: weblogId,
            name: document.getElementById('weblog-name').value,
            desc: document.getElementById('weblog-desc').value,
            link: document.getElementById('weblog-link').value,
            status: document.getElementById('weblog-status').value,
            solution: document.getElementById('weblog-solution').value,
            files: document.getElementById('weblog-file').value.split(',').map(s => s.trim()).filter(s => s),
            creationDate: now.toISOString().split('T')[0],
            meetingDate: '',
            solutionDate: '',
            history: [{ date: now.toLocaleString(), type: 'Status Change', text: 'Created as "New"' }],
            comments: document.getElementById('weblog-comments').value ? [{ date: now.toLocaleString(), text: document.getElementById('weblog-comments').value }] : []
        };
        allWeblogs.push(newWeblog);
        saveWeblogsToLocalStorage();
        renderWeblogs();
        form.reset();
    });

    searchButton.addEventListener('click', () => {
        const id = searchInput.value.trim();
        const weblog = allWeblogs.find(w => w.id === id);
        if (weblog) {
            showWeblogDetails(weblog);
        } else {
            alert('Weblog with this ID was not found.');
        }
    });

    modalCloseBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    saveChangesBtn.addEventListener('click', () => {
        const id = document.getElementById('modal-id').textContent;
        const weblog = allWeblogs.find(w => w.id === id);

        if (weblog) {
            const newStatus = modalStatusSelect.value;
            weblog.name = modalNameInput.value;
            weblog.desc = modalDescTextarea.value;
            weblog.link = document.getElementById('modal-link').href;
            weblog.solution = modalSolutionTextarea.value;
            weblog.files = modalFileInput.value.split(',').map(s => s.trim()).filter(s => s);
            weblog.meetingDate = modalMeetingDateInput.value;
            weblog.solutionDate = modalSolutionDateInput.value;

            if (weblog.status !== newStatus) {
                weblog.history.push({ date: new Date().toLocaleString(), type: 'Status Change', text: `Status changed to "${newStatus}"` });
                weblog.status = newStatus;
            }
            saveWeblogsToLocalStorage();
            renderWeblogs();
            modal.style.display = 'none';
        }
    });

    addCommentBtn.addEventListener('click', () => {
        const id = document.getElementById('modal-id').textContent;
        const weblog = allWeblogs.find(w => w.id === id);
        const commentText = newCommentTextarea.value.trim();
        if (weblog && commentText) {
            weblog.comments.push({ date: new Date().toLocaleString(), text: commentText });
            saveWeblogsToLocalStorage();
            showWeblogDetails(weblog); // Re-render modal to show new comment
        }
    });

    function showWeblogDetails(weblog) {
        document.getElementById('modal-title').textContent = `WEBLOG: ${weblog.id}`;
        document.getElementById('modal-id').textContent = weblog.id;
        modalNameInput.value = weblog.name;
        modalDescTextarea.value = weblog.desc;
        if (weblog.link) {
            modalLinkAnchor.href = weblog.link;
            modalLinkAnchor.textContent = "View WEBLOG";
            modalLinkAnchor.style.display = 'inline';
        } else {
            modalLinkAnchor.textContent = "No link available";
            modalLinkAnchor.style.display = 'block';
        }
        modalStatusSelect.value = weblog.status;
        modalSolutionTextarea.value = weblog.solution;
        modalFileInput.value = weblog.files.join(', ');

        modalFilelist.innerHTML = '';
        if (weblog.files && weblog.files.length > 0) {
            weblog.files.forEach(fileUrl => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = fileUrl;
                a.textContent = fileUrl;
                a.target = '_blank';
                li.appendChild(a);
                modalFilelist.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = "No solution files available.";
            modalFilelist.appendChild(li);
        }

        modalMeetingDateInput.value = weblog.meetingDate;
        modalSolutionDateInput.value = weblog.solutionDate;

        if (weblog.creationDate && weblog.solutionDate) {
            const creationDate = new Date(weblog.creationDate);
            const solutionDate = new Date(weblog.solutionDate);
            const diffTime = Math.abs(solutionDate - creationDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            daysToResolveSpan.textContent = `${diffDays} days`;
        } else {
            daysToResolveSpan.textContent = 'N/A';
        }

        const historyDiv = document.getElementById('modal-history');
        historyDiv.innerHTML = '';

        const allEvents = [
            ...weblog.history.map(h => ({ ...h, type: h.type === 'Status Change' ? 'Status Change' : 'N/A' })),
            ...weblog.comments.map(c => ({ date: c.date, type: 'Comment', text: c.text }))
        ];

        allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

        allEvents.forEach(entry => {
            const entryDiv = document.createElement('div');
            entryDiv.classList.add('history-entry');
            if (entry.type === 'Comment') {
                entryDiv.innerHTML = `<strong>${entry.date} [Comment]:</strong> ${entry.text}`;
            } else {
                entryDiv.innerHTML = `<strong>${entry.date} [Status]:</strong> ${entry.text}`;
            }
            historyDiv.appendChild(entryDiv);
        });

        newCommentTextarea.value = '';
        modal.style.display = 'block';
    }

    exportJsonBtn.addEventListener('click', () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const filename = `weblogs_${year}-${month}-${day}_${hours}-${minutes}-${seconds}.json`;

        const dataStr = JSON.stringify(allWeblogs, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    });

    importJsonBtn.addEventListener('click', () => {
        jsonFileInput.click();
    });

    jsonFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedWeblogs = JSON.parse(event.target.result);
                allWeblogs = importedWeblogs;
                saveWeblogsToLocalStorage();
                alert('Data imported successfully!');
                renderWeblogs();
            } catch (error) {
                alert('Error importing file. Please check if the file is a valid JSON.');
            }
        };
        reader.readAsText(file);
    });

    exportCsvBtn.addEventListener('click', () => {
        let csvContent = "ID,Title,Description,Status,Solution,Files,Link,CreationDate,MeetingDate,SolutionDate,Comments\n";
        allWeblogs.forEach(weblog => {
            const filesCsv = (weblog.files || []).join('; ');
            const commentsCsv = (weblog.comments || []).map(c => `${c.date}: ${c.text.replace(/"/g, '""')}`).join('; ');
            const row = `"${weblog.id}","${weblog.name ? weblog.name.replace(/"/g, '""') : ''}","${weblog.desc ? weblog.desc.replace(/"/g, '""') : ''}","${weblog.status || ''}","${weblog.solution ? weblog.solution.replace(/"/g, '""') : ''}","${filesCsv}","${weblog.link || ''}","${weblog.creationDate || ''}","${weblog.meetingDate || ''}","${weblog.solutionDate || ''}","${commentsCsv}"\n`;
            csvContent += row;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'weblogs.csv';
        a.click();
        URL.revokeObjectURL(url);
    });

    function renderWeblogs() {
        currentTableBody.innerHTML = '';
        completedTableBody.innerHTML = '';

        const currentWeblogs = allWeblogs.filter(w => w.status !== 'Resolved' && w.status !== 'Closed');
        const completedWeblogs = allWeblogs.filter(w => w.status === 'Resolved' || w.status === 'Closed');

        if (currentWeblogs.length === 0) {
            const row = currentTableBody.insertRow();
            row.innerHTML = `<td colspan="4" style="text-align: center; color: var(--text-secondary);">No active weblogs found.</td>`;
        } else {
            currentWeblogs.forEach(weblog => addWeblogRow(weblog, currentTableBody));
        }

        if (completedWeblogs.length === 0) {
            const row = completedTableBody.insertRow();
            row.innerHTML = `<td colspan="4" style="text-align: center; color: var(--text-secondary);">No completed weblogs found.</td>`;
        } else {
            completedWeblogs.forEach(weblog => addWeblogRow(weblog, completedTableBody));
        }
    }

    function addWeblogRow(weblog, tableBody) {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${weblog.id}</td>
            <td>${weblog.name}</td>
            <td>${weblog.status}</td>
            <td class="action-buttons-cell">
                <button class="view-btn">View</button>
                <button class="delete-btn">Delete</button>
            </td>
        `;

        row.querySelector('.view-btn').addEventListener('click', () => showWeblogDetails(weblog));
        row.querySelector('.delete-btn').addEventListener('click', () => {
            if (confirm(`Are you sure you want to delete WEBLOG "${weblog.name}"?`)) {
                allWeblogs = allWeblogs.filter(w => w.id !== weblog.id);
                saveWeblogsToLocalStorage();
                renderWeblogs();
            }
        });
    }

    function saveWeblogsToLocalStorage() {
        try {
            localStorage.setItem('weblogs', JSON.stringify(allWeblogs));
        } catch (e) {
            console.error("Failed to save weblogs to localStorage:", e);
            alert("Error: Could not save data. Your browser's storage might be full.");
        }
    }

    function loadWeblogsFromLocalStorage() {
        allWeblogs = JSON.parse(localStorage.getItem('weblogs') || '[]');
        allWeblogs.forEach(weblog => {
            if (!weblog.files) weblog.files = [];
            if (!weblog.comments) weblog.comments = [];
        });
    }
});
