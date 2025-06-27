let players = JSON.parse(localStorage.getItem('pingPongPlayers') || '{}');
let matchHistory = JSON.parse(localStorage.getItem('pingPongMatches') || '[]');

function saveData() {
  localStorage.setItem('pingPongPlayers', JSON.stringify(players));
  localStorage.setItem('pingPongMatches', JSON.stringify(matchHistory));
}

function showNotification(message) {
  const notif = document.getElementById('notification');
  notif.textContent = message;
  notif.classList.add('show');
  setTimeout(() => notif.classList.remove('show'), 2000);
}

function addPlayer() {
  const name = document.getElementById('newPlayerName').value.trim();
  if (!name) return alert('Enter player name');
  if (players[name]) return alert('Player already exists');
  players[name] = { wins: 0, losses: 0, elo: 1000 };
  saveData();
  populateDropdowns();
  renderLeaderboard();
  showNotification(`Player "${name}" added.`);
  document.getElementById('newPlayerName').value = '';
}

function resetPlayers() {
  if (!confirm('Are you sure you want to reset all data?')) return;
  localStorage.removeItem('pingPongPlayers');
  localStorage.removeItem('pingPongMatches');
  players = {};
  matchHistory = [];
  renderLeaderboard();
  renderMatchHistory();
  populateDropdowns();
  renderTopPlayer();
  showNotification('All data reset');
}

function addMatch() {
  const p1 = document.getElementById('player1').value;
  const p2 = document.getElementById('player2').value;
  const s1 = parseInt(document.getElementById('score1').value);
  const s2 = parseInt(document.getElementById('score2').value);
  const today = new Date().toISOString().split('T')[0];

  if (!p1 || !p2 || p1 === p2 || isNaN(s1) || isNaN(s2)) {
    return alert('Fill all match fields correctly');
  }

  matchHistory.push({ date: today, player1: p1, score1: s1, player2: p2, score2: s2 });

  if (s1 > s2) {
    players[p1].wins++;
    players[p2].losses++;
  } else if (s2 > s1) {
    players[p2].wins++;
    players[p1].losses++;
  }

  saveData();
  renderLeaderboard();
  renderMatchHistory();
  renderTopPlayer();
  showNotification('Match added');
  document.getElementById('score1').value = '';
  document.getElementById('score2').value = '';
}

function renderLeaderboard() {
  const tbody = document.getElementById('leaderboard');
  tbody.innerHTML = '';
  const sorted = Object.entries(players).sort(([, a], [, b]) => b.wins - a.wins);
  for (const [name, stats] of sorted) {
    const total = stats.wins + stats.losses;
    const winRate = total ? ((stats.wins / total) * 100).toFixed(1) + '%' : '-';
    const row = `<tr>
      <td>${name}</td>
      <td>${stats.wins}</td>
      <td>${stats.losses}</td>
      <td>${winRate}</td>
      <td>${stats.elo}</td>
      <td>${total}</td>
    </tr>`;
    tbody.innerHTML += row;
  }
}

function renderMatchHistory(filterDate = '', filterPlayer = '') {
  const tbody = document.getElementById('matchHistory');
  tbody.innerHTML = '';
  const matches = matchHistory.slice().reverse().filter(m => {
    const byDate = !filterDate || m.date === filterDate;
    const byPlayer = !filterPlayer || m.player1 === filterPlayer || m.player2 === filterPlayer;
    return byDate && byPlayer;
  });
  for (const match of matches) {
    const row = `<tr>
      <td>${match.date}</td>
      <td>${match.player1}</td>
      <td>${match.score1} : ${match.score2}</td>
      <td>${match.player2}</td>
    </tr>`;
    tbody.innerHTML += row;
  }
}

function renderTopPlayer() {
  let top = null;
  for (const [name, stats] of Object.entries(players)) {
    if (!top || stats.wins > top.stats.wins) {
      top = { name, stats };
    }
  }
  const el = document.getElementById('topPlayer');
  el.textContent = top ? `${top.name} (${top.stats.wins} Wins)` : 'No players yet';
}

function populateDropdowns() {
  const dropdowns = [document.getElementById('player1'), document.getElementById('player2'), document.getElementById('filterPlayer')];
  for (const dropdown of dropdowns) {
    dropdown.innerHTML = `<option value="">-- All Players --</option>`;
    for (const name of Object.keys(players)) {
      const option = document.createElement('option');
      option.value = option.textContent = name;
      dropdown.appendChild(option.cloneNode(true));
    }
  }
}

document.getElementById('addMatchBtn').addEventListener('click', addMatch);
document.getElementById('filterDate').addEventListener('input', e => {
  renderMatchHistory(e.target.value, document.getElementById('filterPlayer').value);
});
document.getElementById('filterPlayer').addEventListener('change', e => {
  renderMatchHistory(document.getElementById('filterDate').value, e.target.value);
});

function exportData() {
  const data = { players, matchHistory };
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pingpong_data.json';
  a.click();
  URL.revokeObjectURL(url);
  showNotification('Data saved');
}

document.getElementById('importFile').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = event => {
    try {
      const data = JSON.parse(event.target.result);
      if (data.players && data.matchHistory) {
        players = data.players;
        matchHistory = data.matchHistory;
        saveData();
        populateDropdowns();
        renderLeaderboard();
        renderMatchHistory();
        renderTopPlayer();
        showNotification('Data loaded');
      } else {
        alert('Invalid data file');
      }
    } catch (err) {
      alert('Failed to load data');
    }
  };
  reader.readAsText(file);
  this.value = '';
});

renderLeaderboard();
renderMatchHistory();
renderTopPlayer();
populateDropdowns();
