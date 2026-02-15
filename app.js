/**
 * Chore Chart - App Logic
 * 
 * This module handles all UI rendering and user interaction.
 * It relies exclusively on ChoreRepository (repository.js) for data access.
 */

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Returns the 7-day array rotated so that `startDay` is first.
 */
function getOrderedDays() {
    const startDay = ChoreRepository.getWeekStartDay();
    const startIndex = ALL_DAYS.indexOf(startDay);
    if (startIndex <= 0) return [...ALL_DAYS];
    return [...ALL_DAYS.slice(startIndex), ...ALL_DAYS.slice(0, startIndex)];
}

async function init() {
    await initDatabase();
    renderHeader();
    renderBoard();
    bindEvents();
}

/**
 * Renders the chart title and subtitle from settings.
 */
function renderHeader() {
    const title = ChoreRepository.getSetting('chart_title') || 'Chore Chart';
    const subtitle = ChoreRepository.getSetting('chart_subtitle') || 'Digital Magnetic Board';
    document.getElementById('chart-title').textContent = title;
    document.getElementById('chart-subtitle').textContent = subtitle;
    document.title = `${title} - ${subtitle}`;
}

function renderBoard() {
    const board = document.getElementById('chore-board');
    board.innerHTML = '';

    const orderedDays = getOrderedDays();
    const people = ChoreRepository.getAllPeople();
    const chores = ChoreRepository.getAllChores();
    const assignments = ChoreRepository.getAllAssignments();

    // ── Header Row: empty corner + day names ──
    const corner = document.createElement('div');
    corner.className = 'board-cell header';
    corner.textContent = '';
    board.appendChild(corner);

    orderedDays.forEach(day => {
        const header = document.createElement('div');
        header.className = 'board-cell header';
        header.textContent = day;
        board.appendChild(header);
    });

    // ── Chore Rows ──
    chores.forEach(chore => {
        const nameCell = document.createElement('div');
        nameCell.className = 'board-cell chore-name';
        nameCell.textContent = chore.name;
        board.appendChild(nameCell);

        orderedDays.forEach(day => {
            const dayIndex = ALL_DAYS.indexOf(day);
            const cell = document.createElement('div');
            cell.className = 'board-cell';
            cell.dataset.choreId = chore.id;
            cell.dataset.dayIndex = dayIndex;

            const key = `${chore.id}-${dayIndex}`;
            const assignment = assignments[key];
            if (assignment) {
                cell.appendChild(createMarker(assignment));
            }

            cell.addEventListener('click', () => handleCellClick(chore.id, dayIndex, people));
            board.appendChild(cell);
        });
    });
}

function createMarker(person) {
    const marker = document.createElement('div');
    marker.className = 'marker';
    marker.style.backgroundColor = person.color;
    marker.textContent = person.initials;
    marker.title = person.name;
    return marker;
}

/**
 * Click handler: cycles through people for a cell, then clears.
 */
function handleCellClick(choreId, dayIndex, people) {
    if (!people.length) return;

    const assignments = ChoreRepository.getAllAssignments();
    const key = `${choreId}-${dayIndex}`;
    const current = assignments[key];

    if (!current) {
        ChoreRepository.setAssignment(choreId, dayIndex, people[0].id);
    } else {
        const idx = people.findIndex(p => p.id === current.personId);
        if (idx < people.length - 1) {
            ChoreRepository.setAssignment(choreId, dayIndex, people[idx + 1].id);
        } else {
            ChoreRepository.clearAssignment(choreId, dayIndex);
        }
    }

    renderBoard();
}

// ── Settings Modal ──────────────────────────────────────────

function openSettings() {
    const modal = document.getElementById('settings-modal');
    const select = document.getElementById('week-start-select');
    const titleInput = document.getElementById('chart-title-input');
    const subtitleInput = document.getElementById('chart-subtitle-input');

    select.value = ChoreRepository.getWeekStartDay();
    titleInput.value = ChoreRepository.getSetting('chart_title') || 'Chore Chart';
    subtitleInput.value = ChoreRepository.getSetting('chart_subtitle') || 'Digital Magnetic Board';

    modal.classList.remove('hidden');
}

function closeSettings() {
    document.getElementById('settings-modal').classList.add('hidden');
}

function saveSettings() {
    const select = document.getElementById('week-start-select');
    const titleInput = document.getElementById('chart-title-input');
    const subtitleInput = document.getElementById('chart-subtitle-input');

    ChoreRepository.setWeekStartDay(select.value);
    ChoreRepository.setSetting('chart_title', titleInput.value.trim() || 'Chore Chart');
    ChoreRepository.setSetting('chart_subtitle', subtitleInput.value.trim() || 'Digital Magnetic Board');

    closeSettings();
    renderHeader();
    renderBoard();
}

// ── Event Binding ───────────────────────────────────────────

function bindEvents() {
    document.getElementById('add-chore-btn').addEventListener('click', () => {
        const name = prompt('Enter chore name:');
        if (name && name.trim()) {
            ChoreRepository.addChore(name.trim());
            renderBoard();
        }
    });

    document.getElementById('reset-board-btn').addEventListener('click', () => {
        if (confirm('Clear all assignments for the week?')) {
            ChoreRepository.clearAllAssignments();
            renderBoard();
        }
    });

    // Settings
    document.getElementById('settings-btn').addEventListener('click', openSettings);
    document.getElementById('settings-close-btn').addEventListener('click', closeSettings);
    document.getElementById('settings-save-btn').addEventListener('click', saveSettings);

    // Close modal on overlay click
    document.getElementById('settings-modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeSettings();
    });
}

document.addEventListener('DOMContentLoaded', init);
