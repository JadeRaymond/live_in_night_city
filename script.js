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
    const filterStatusSelect = document.getElementById('filter-status');
    const sortBySelect = document.getElementById('sort-by');
    const filterDateInput = document.getElementById('filter-date');

    const infoModal = document.getElementById('info-modal');
    const infoModalTitle = document.getElementById('info-modal-title');
    const infoModalMessage = document.getElementById('info-modal-message');
    const infoModalOkBtn = infoModal.querySelector('.ok-btn');

    const confirmModal = document.getElementById('confirm-modal');
    const confirmModalTitle = document.getElementById('confirm-modal-title');
    const confirmModalMessage = document.getElementById('confirm-modal-message');
    const confirmModalOkBtn = confirmModal.querySelector('.ok-btn');
    const confirmModalCancelBtn = confirmModal.querySelector('.cancel-btn');

    const modal = document.getElementById('weblog-modal');
    const modalCloseBtn = modal.querySelector('.close-btn');
    const modalIdSpan = document.getElementById('modal-id');
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

    const themeSwitcher = document.getElementById('theme-switcher');
    const body = document.body;

    // Custom modal function instead of alert/confirm
    function showInfoModal(title, message) {
        infoModalTitle.textContent = title;
        infoModalMessage.textContent = message;
        infoModal.style.display = 'block';
    }

    function showConfirmModal(title, message, onConfirm) {
        confirmModalTitle.textContent = title;
        confirmModalMessage.textContent = message;
        confirmModal.style.display = 'block';
        confirmModalOkBtn.onclick = () => {
            confirmModal.style.display = 'none';
            onConfirm();
        };
        confirmModalCancelBtn.onclick = () => {
            confirmModal.style.display = 'none';
        };
    }

    infoModalOkBtn.addEventListener('click', () => {
        infoModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === infoModal) {
            infoModal.style.display = 'none';
        }
    });

    // Theme logic
    const currentTheme = localStorage.getItem('theme') ? localStorage.getItem('theme') : 'light';
    if (currentTheme === 'dark') {
        body.classList.add('dark-theme');
    }

    themeSwitcher.addEventListener('click', () => {
        body.classList.toggle('dark-theme');
        const theme = body.classList.contains('dark-theme') ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
        renderCharts(allWeblogs); // Re-render charts to apply new theme colors
    });

    let allWeblogs = [];

    loadWeblogsFromLocalStorage();
    renderWeblogs(allWeblogs);
    renderCharts(allWeblogs);

    // Event listeners for sorting and filtering
    filterStatusSelect.addEventListener('change', () => renderWeblogs(allWeblogs));
    sortBySelect.addEventListener('change', () => renderWeblogs(allWeblogs));
    filterDateInput.addEventListener('change', () => renderWeblogs(allWeblogs));

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const now = new Date();
        const weblogId = document.getElementById('weblog-id').value.trim();

        if (!weblogId) {
            showInfoModal('Error', 'WEBLOG ID is required.');
            return;
        }

        if (allWeblogs.some(w => w.id === weblogId)) {
            showInfoModal('Error', `A WEBLOG with ID "${weblogId}" already exists.`);
            return;
        }

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
            history: [{ date: now.toISOString(), type: 'Status Change', text: 'Created as "New"' }],
            comments: document.getElementById('weblog-comments').value ? [{ date: now.toISOString(), text: document.getElementById('weblog-comments').value }] : []
        };
        allWeblogs.push(newWeblog);
        saveWeblogsToLocalStorage();
        renderWeblogs(allWeblogs);
        renderCharts(allWeblogs);
        form.reset();
    });

    searchButton.addEventListener('click', () => {
        const query = searchInput.value.trim().toLowerCase();
        if (query === '') {
            renderWeblogs(allWeblogs);
            return;
        }
        const filteredWeblogs = allWeblogs.filter(w =>
            w.id.toLowerCase().includes(query) ||
            w.name.toLowerCase().includes(query) ||
            w.desc.toLowerCase().includes(query) ||
            w.solution.toLowerCase().includes(query) ||
            (w.comments && w.comments.some(c => c.text.toLowerCase().includes(query)))
        );
        renderWeblogs(filteredWeblogs);
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
        const id = modalIdSpan.textContent;
        const weblog = allWeblogs.find(w => w.id === id);

        if (weblog) {
            const newStatus = modalStatusSelect.value;
            const isStatusChange = weblog.status !== newStatus;

            weblog.name = modalNameInput.value;
            weblog.desc = modalDescTextarea.value;
            weblog.link = modalLinkAnchor.href !== '#' ? modalLinkAnchor.href : '';
            weblog.solution = modalSolutionTextarea.value;
            weblog.files = modalFileInput.value.split(',').map(s => s.trim()).filter(s => s);
            weblog.meetingDate = modalMeetingDateInput.value;
            weblog.solutionDate = modalSolutionDateInput.value;

            if (isStatusChange) {
                weblog.history.push({ date: new Date().toISOString(), type: 'Status Change', text: `Status changed to "${newStatus}"` });
                weblog.status = newStatus;
            }

            saveWeblogsToLocalStorage();
            renderWeblogs(allWeblogs);
            renderCharts(allWeblogs);
            modal.style.display = 'none';
        }
    });

    addCommentBtn.addEventListener('click', () => {
        const id = modalIdSpan.textContent;
        const weblog = allWeblogs.find(w => w.id === id);
        const commentText = newCommentTextarea.value.trim();
        if (weblog && commentText) {
            weblog.comments.push({ date: new Date().toISOString(), text: commentText });
            saveWeblogsToLocalStorage();
            showWeblogDetails(weblog); // Re-render modal to show new comment
        }
    });

    function formatDate(isoString) {
        if (!isoString) return 'N/A';
        const date = new Date(isoString);
        return date.toLocaleString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    function showWeblogDetails(weblog) {
        document.getElementById('modal-title').textContent = `WEBLOG: ${weblog.id}`;
        modalIdSpan.textContent = weblog.id;
        modalNameInput.value = weblog.name;
        modalDescTextarea.value = weblog.desc;
        if (weblog.link) {
            modalLinkAnchor.href = weblog.link;
            modalLinkAnchor.textContent = "View WEBLOG";
            modalLinkAnchor.style.display = 'inline';
        } else {
            modalLinkAnchor.href = '#';
            modalLinkAnchor.textContent = "No link available";
            modalLinkAnchor.style.display = 'block';
        }
        modalStatusSelect.value = weblog.status;
        modalSolutionTextarea.value = weblog.solution;
        modalFileInput.value = (weblog.files || []).join(', ');

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
            ...(weblog.history || []).map(h => ({ ...h, type: 'Status Change', text: h.text })),
            ...(weblog.comments || []).map(c => ({ ...c, type: 'Comment', text: c.text }))
        ];

        allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

        allEvents.forEach(entry => {
            const entryDiv = document.createElement('div');
            entryDiv.classList.add('history-entry');
                    const formattedDate = formatDate(entry.date);
            if (entry.type === 'Comment') {
                        entryDiv.innerHTML = `<strong>${formattedDate} [Comment]:</strong> ${entry.text}`;
            } else {
                        entryDiv.innerHTML = `<strong>${formattedDate} [Status]:</strong> ${entry.text}`;
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
                renderWeblogs(allWeblogs);
                renderCharts(allWeblogs);
                showInfoModal('Success', 'Data imported successfully!');
            } catch (error) {
                showInfoModal('Error', 'Error importing file. Please check if the file is a valid JSON.');
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

    // Event delegation for view/delete buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-btn')) {
            const row = e.target.closest('tr');
            const weblogId = row.querySelector('td:first-child').textContent;
            const weblog = allWeblogs.find(w => w.id === weblogId);
            if (weblog) {
                showWeblogDetails(weblog);
            }
        }
        if (e.target.classList.contains('delete-btn')) {
            const row = e.target.closest('tr');
            const weblogId = row.querySelector('td:first-child').textContent;
            showConfirmModal('Confirm Deletion', `Are you sure you want to delete WEBLOG ID: ${weblogId}? This action cannot be undone.`, () => {
                allWeblogs = allWeblogs.filter(w => w.id !== weblogId);
                saveWeblogsToLocalStorage();
                renderWeblogs(allWeblogs);
                renderCharts(allWeblogs);
            });
        }
    });

    function renderWeblogs(weblogsToRender) {
        currentTableBody.innerHTML = '';
        completedTableBody.innerHTML = '';

        // Apply filters
        const filteredByStatus = filterStatusSelect.value === 'all'
            ? weblogsToRender
            : weblogsToRender.filter(w => w.status === filterStatusSelect.value);

        const filteredByDate = filterDateInput.value
            ? filteredByStatus.filter(w => {
                const filterDate = new Date(filterDateInput.value);
                const creationDate = new Date(w.creationDate);
                return creationDate >= filterDate;
            })
            : filteredByStatus;

        // Apply sorting
        const sortedWeblogs = filteredByDate.sort((a, b) => {
            const sortKey = sortBySelect.value;
            if (sortKey === 'creationDate') {
                return new Date(a.creationDate) - new Date(b.creationDate);
            } else if (sortKey === 'solutionDate') {
                return new Date(a.solutionDate) - new Date(b.solutionDate);
            } else if (sortKey === 'status') {
                const statusOrder = { 'New': 1, 'In Progress': 2, 'Resolved': 3, 'Closed': 4 };
                return (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5);
            }
            return 0;
        });

        sortedWeblogs.forEach(weblog => {
            const now = new Date();
            const creationDate = new Date(weblog.creationDate);
            const daysOld = Math.floor((now - creationDate) / (1000 * 60 * 60 * 24));
            const isStale = daysOld > 30 && (weblog.status === 'New' || weblog.status === 'In Progress');

            const row = document.createElement('tr');
            if (isStale) {
                row.classList.add('stale-row');
            }

            row.innerHTML = `
                <td>${weblog.id}</td>
                <td>${weblog.name}</td>
                <td>${weblog.status} ${isStale ? '⚠️' : ''}</td>
                <td class="action-buttons-cell">
                    <button class="view-btn">View</button>
                    <button class="delete-btn">Delete</button>
                </td>
            `;

            if (weblog.status === 'Resolved' || weblog.status === 'Closed') {
                completedTableBody.appendChild(row);
            } else {
                currentTableBody.appendChild(row);
            }
        });
    }

    function saveWeblogsToLocalStorage() {
        localStorage.setItem('weblogs', JSON.stringify(allWeblogs));
    }

    function loadWeblogsFromLocalStorage() {
        allWeblogs = JSON.parse(localStorage.getItem('weblogs') || '[]');
        allWeblogs.forEach(weblog => {
            if (!weblog.files) weblog.files = [];
            if (!weblog.comments) weblog.comments = [];
            if (!weblog.history) weblog.history = [];
        });
    }

    function renderCharts(weblogs) {
        const chartData = weblogs.reduce((acc, weblog) => {
            acc[weblog.status] = (acc[weblog.status] || 0) + 1;
            return acc;
        }, {});

        const chartCanvas = document.getElementById('weblog-status-chart');
        const chartExists = Chart.getChart(chartCanvas);
        if (chartExists) {
            chartExists.destroy();
        }

        const computedStyles = getComputedStyle(document.documentElement);
        const statusColors = {
            'New': computedStyles.getPropertyValue('--primary-accent') || '#007bff',
            'In Progress': '#ffc107', // Keeping some defaults as fallbacks
            'Resolved': '#28a745',
            'Closed': computedStyles.getPropertyValue('--delete-color') || '#dc3545'
        };

        const chartLabels = Object.keys(chartData);
        const chartValues = Object.values(chartData);
        const backgroundColors = chartLabels.map(label => statusColors[label] || '#cccccc');

        new Chart(chartCanvas, {
            type: 'doughnut',
            data: {
                labels: chartLabels,
                datasets: [{
                    data: chartValues,
                    backgroundColor: backgroundColors,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                            font: {
                                family: 'Poppins'
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'WEBLOG Statuses',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        font: {
                            size: 18,
                            family: 'Poppins'
                        }
                    }
                }
            }
        });
    }
});
