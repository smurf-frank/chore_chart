/**
 * Chore Chart - App Logic
 * 
 * This module handles all UI rendering and user interaction.
 * It relies exclusively on ChoreRepository (repository.js) for data access.
 */

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

async function init() {
    await initDatabase();
    renderBoard();
    bindEvents();
}

function renderBoard() {
    const board = document.getElementById('chore-board');
    board.innerHTML = '';

    const people = ChoreRepository.getAllPeople();
    const chores = ChoreRepository.getAllChores();
    const assignments = ChoreRepository.getAllAssignments();

    // ── Header Row: empty corner + day names ──
    const corner = document.createElement('div');
    corner.className = 'board-cell header';
    corner.textContent = '';
    board.appendChild(corner);

    DAYS.forEach(day => {
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

        DAYS.forEach((_, dayIndex) => {
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
        // No one assigned → assign first person
        ChoreRepository.setAssignment(choreId, dayIndex, people[0].id);
    } else {
        // Find current person index
        const idx = people.findIndex(p => p.id === current.personId);
        if (idx < people.length - 1) {
            // Cycle to next person
            ChoreRepository.setAssignment(choreId, dayIndex, people[idx + 1].id);
        } else {
            // Past last person → clear
            ChoreRepository.clearAssignment(choreId, dayIndex);
        }
    }

    renderBoard();
}

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
}

document.addEventListener('DOMContentLoaded', init);
