let allProblems = [];
let solvedIds = new Set();

let currentContest = 'all';
let currentQ = 'ALL';
let currentLevel = 'all';
let searchQuery = '';

const LEVEL_RANGES = {
  '1': [1000, 1299],
  '2': [1300, 1499],
  '3': [1500, 1699],
  '4': [1700, 1899],
  '5': [1900, 2099],
  '6': [2100, 2399],
  '7': [2400, 3500],
};

function getRatingBadgeStyle(rating) {
  if (rating < 1200) return 'color: #9ca3af; border-color: #4b5563; background: #1f2937;';
  if (rating < 1400) return 'color: #34d399; border-color: #065f46; background: #064e3b33;';
  if (rating < 1600) return 'color: #22d3ee; border-color: #155e75; background: #08334433;';
  if (rating < 1900) return 'color: #60a5fa; border-color: #1e40af; background: #1e3a8a33;';
  if (rating < 2100) return 'color: #c084fc; border-color: #6b21a8; background: #581c8733;';
  if (rating < 2400) return 'color: #fbbf24; border-color: #92400e; background: #78350f33;';
  return 'color: #f43f5e; border-color: #9f1239; background: #88133733;';
}

async function loadData() {
  try {
    const res = await fetch('data/problems.json');
    allProblems = await res.json();
    // Default: Sort by rating ascending (increasing difficulty)
    allProblems.sort((a, b) => a.exactRating - b.exactRating);

    // Load solved
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['lc_solved'], (result) => {
        if (result.lc_solved) {
          solvedIds = new Set(result.lc_solved);
        }
        render();
      });
    } else {
      const saved = localStorage.getItem('lc_solved');
      if (saved) solvedIds = new Set(JSON.parse(saved));
      render();
    }
  } catch (err) {
    document.getElementById('problemList').innerHTML = `<div class="loading">Error loading data: ${err.message}</div>`;
  }
}

function saveSolved() {
  const arr = Array.from(solvedIds);
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ lc_solved: arr });
  } else {
    localStorage.setItem('lc_solved', JSON.stringify(arr));
  }
}

function getFilteredProblems() {
  return allProblems.filter((p) => {
    // Contest filter
    if (currentContest !== 'all' && p.contestType !== currentContest) return false;

    // Question Index
    if (currentQ !== 'ALL' && p.problemIndex !== currentQ) return false;

    // Level ladder
    if (currentLevel !== 'all') {
      const [minR, maxR] = LEVEL_RANGES[currentLevel];
      if (p.exactRating < minR || p.exactRating > maxR) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchId = p.id.toString().includes(q);
      if (!matchTitle && !matchId) return false;
    }

    return true;
  });
}

function render() {
  const filtered = getFilteredProblems();

  // Update counts
  document.getElementById('totalCount').textContent = allProblems.length;
  document.getElementById('solvedCount').textContent = solvedIds.size;
  document.getElementById('resultCount').textContent = `${filtered.length} problems`;

  const listEl = document.getElementById('problemList');
  if (filtered.length === 0) {
    listEl.innerHTML = '<div class="loading">No problems matching filters</div>';
    return;
  }

  // Display top 100 for fast rendering in popup
  const displayItems = filtered.slice(0, 100);

  listEl.innerHTML = displayItems
    .map((p) => {
      const isSolved = solvedIds.has(p.id);
      const style = getRatingBadgeStyle(p.exactRating);

      return `
      <div class="problem-item ${isSolved ? 'solved' : ''}" data-id="${p.id}">
        <div class="checkbox-col">
          <input type="checkbox" ${isSolved ? 'checked' : ''} data-id="${p.id}" class="solve-check">
        </div>
        <div class="problem-info">
          <div class="problem-title-row">
            <span class="problem-id">#${p.id}</span>
            <a href="${p.url}" target="_blank" class="problem-title" title="${p.title}">${p.title}</a>
          </div>
          <div class="problem-meta">
            <span class="pos-tag pos-${p.problemIndex}">${p.problemIndex}</span>
            <span class="contest-badge">${p.contestName}</span>
          </div>
        </div>
        <div class="rating-badge" style="${style}">
          ${p.exactRating.toFixed(1)}
        </div>
      </div>
    `;
    })
    .join('');

  // Attach event listeners
  listEl.querySelectorAll('.solve-check').forEach((cb) => {
    cb.addEventListener('change', (e) => {
      const id = parseInt(e.target.getAttribute('data-id'), 10);
      if (e.target.checked) {
        solvedIds.add(id);
      } else {
        solvedIds.delete(id);
      }
      saveSolved();
      render();
    });
  });
}

// Event Listeners setup
document.addEventListener('DOMContentLoaded', () => {
  loadData();

  // Search input
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    render();
  });

  // Contest tabs
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      e.target.classList.add('active');
      currentContest = e.target.getAttribute('data-contest');
      render();
    });
  });

  // Question index buttons
  document.querySelectorAll('.q-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.q-btn').forEach((b) => b.classList.remove('active'));
      e.target.classList.add('active');
      currentQ = e.target.getAttribute('data-q');
      render();
    });
  });

  // Level selector
  const levelSelect = document.getElementById('levelSelect');
  levelSelect.addEventListener('change', (e) => {
    currentLevel = e.target.value;
    render();
  });

  // Random button
  document.getElementById('randomBtn').addEventListener('click', () => {
    const filtered = getFilteredProblems();
    if (filtered.length === 0) return;
    const unsolved = filtered.filter((p) => !solvedIds.has(p.id));
    const pool = unsolved.length > 0 ? unsolved : filtered;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    if (picked) {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.create({ url: picked.url });
      } else {
        window.open(picked.url, '_blank');
      }
    }
  });
});
