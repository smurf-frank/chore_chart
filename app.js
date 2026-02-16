/**
 * Chore Chart - App Logic
 * 
 * This module handles all UI rendering and user interaction.
 * It relies exclusively on ChoreRepository (repository.js) for data access.
 */

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
let sortDirection = 'asc'; // 'asc' or 'desc'

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
    renderPalette();
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

// ── Board Rendering ─────────────────────────────────────────

function renderBoard() {
    const board = document.getElementById('chore-board');
    board.innerHTML = '';

    const orderedDays = getOrderedDays();
    const chores = ChoreRepository.getAllChores();
    const assignments = ChoreRepository.getAllAssignments();
    const maxMarkers = ChoreRepository.getMaxMarkersPerCell();
    const shadingEnabled = ChoreRepository.getRowShadingEnabled();
    const shadeColor = ChoreRepository.getRowShadingColor();
    const choreColWidth = ChoreRepository.getChoreColumnWidth();

    board.style.setProperty('--chore-col-width', `${choreColWidth}px`);
    if (shadingEnabled) {
        board.style.setProperty('--row-shade-color', shadeColor);
    }

    // ── Header Row: "+" add-chore button + day names ──
    // ── Header Row: "+" add-chore button + day names ──
    const corner = document.createElement('div');
    corner.className = 'board-cell header add-chore-corner corner-cell';

    const addBtn = document.createElement('button');
    addBtn.className = 'add-chore-btn';
    addBtn.textContent = '+';
    addBtn.title = 'Add Chore';
    addBtn.addEventListener('click', () => {
        const name = prompt('Enter chore name:');
        if (name && name.trim()) {
            ChoreRepository.addChore(name.trim());
            renderBoard();
        }
    });
    corner.appendChild(addBtn);

    const sortBtn = document.createElement('button');
    sortBtn.className = 'sort-chore-btn';
    sortBtn.innerHTML = sortDirection === 'asc' ? '↓' : '↑';
    sortBtn.title = `Sort Chores (${sortDirection === 'asc' ? 'A-Z' : 'Z-A'})`;
    sortBtn.addEventListener('click', () => {
        const currentChores = ChoreRepository.getAllChores();
        currentChores.sort((a, b) => {
            if (sortDirection === 'asc') {
                return a.name.localeCompare(b.name);
            } else {
                return b.name.localeCompare(a.name);
            }
        });

        const orderedIds = currentChores.map(c => c.id);
        ChoreRepository.updateChoreOrders(orderedIds);

        // Toggle direction for next click
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        renderBoard();
    });
    corner.appendChild(sortBtn);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const startX = e.pageX;
        const startWidth = ChoreRepository.getChoreColumnWidth();
        resizeHandle.classList.add('resizing');

        const onMouseMove = (moveEvent) => {
            const newWidth = Math.max(100, Math.min(600, startWidth + (moveEvent.pageX - startX)));
            board.style.setProperty('--chore-col-width', `${newWidth}px`);
            ChoreRepository.setChoreColumnWidth(newWidth);
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            resizeHandle.classList.remove('resizing');
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
    corner.appendChild(resizeHandle);

    board.appendChild(corner);

    orderedDays.forEach(day => {
        const header = document.createElement('div');
        header.className = 'board-cell header';
        header.textContent = day;
        board.appendChild(header);
    });

    // ── Chore Rows ──
    chores.forEach((chore, index) => {
        const isShaded = shadingEnabled && (index % 2 !== 0);

        const nameCell = document.createElement('div');
        nameCell.className = 'board-cell chore-name';
        if (isShaded) nameCell.classList.add('board-row-shaded');
        nameCell.draggable = true;
        nameCell.dataset.choreId = chore.id;
        nameCell.dataset.index = index;

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'chore-name-input';
        nameInput.value = chore.name;
        nameInput.title = chore.name; // Full name on hover
        nameInput.maxLength = 128;
        nameInput.addEventListener('change', () => {
            const newName = nameInput.value.trim();
            if (newName && newName !== chore.name) {
                ChoreRepository.updateChore(chore.id, { name: newName });
                renderBoard();
            } else {
                nameInput.value = chore.name;
            }
        });
        nameCell.appendChild(nameInput);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'chore-delete-btn';
        deleteBtn.textContent = '×';
        deleteBtn.title = `Delete ${chore.name}`;
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`Delete "${chore.name}" and all its assignments?`)) {
                ChoreRepository.removeChore(chore.id);
                renderBoard();
            }
        });
        nameCell.appendChild(deleteBtn);

        // Rotate button
        const rotateBtn = document.createElement('button');
        rotateBtn.className = 'chore-rotate-btn';
        rotateBtn.textContent = '🔄';
        rotateBtn.title = `Rotate group assignment for ${chore.name}`;
        rotateBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openRotationModal(chore.id);
        });
        nameCell.appendChild(rotateBtn);

        // Drag events for reordering chores
        nameCell.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/chore-id', String(chore.id));
            e.dataTransfer.effectAllowed = 'move';
            nameCell.classList.add('dragging-chore');
        });

        nameCell.addEventListener('dragend', () => {
            nameCell.classList.remove('dragging-chore');
            document.querySelectorAll('.chore-name').forEach(c => c.classList.remove('drag-over-chore'));
        });

        nameCell.addEventListener('dragover', (e) => {
            if (e.dataTransfer.types.includes('text/chore-id')) {
                e.preventDefault();
                nameCell.classList.add('drag-over-chore');
            }
        });

        nameCell.addEventListener('dragleave', () => {
            nameCell.classList.remove('drag-over-chore');
        });

        nameCell.addEventListener('drop', (e) => {
            const draggedId = parseInt(e.dataTransfer.getData('text/chore-id'), 10);
            if (!draggedId || draggedId === chore.id) return;

            e.preventDefault();
            const currentIds = chores.map(c => c.id);
            const fromIndex = currentIds.indexOf(draggedId);
            const toIndex = currentIds.indexOf(chore.id);

            // Reorder the array
            currentIds.splice(fromIndex, 1);
            currentIds.splice(toIndex, 0, draggedId);

            ChoreRepository.updateChoreOrders(currentIds);
            renderBoard();
        });

        board.appendChild(nameCell);

        orderedDays.forEach(day => {
            const dayIndex = ALL_DAYS.indexOf(day);
            const cell = document.createElement('div');
            cell.className = 'board-cell assignment-cell';
            if (isShaded) cell.classList.add('board-row-shaded');
            cell.dataset.choreId = chore.id;
            cell.dataset.dayIndex = dayIndex;

            const key = `${chore.id}-${dayIndex}`;
            const cellAssignments = assignments[key] || [];

            // Render markers in cell
            cellAssignments.forEach(a => {
                const marker = createCellMarker(a, chore.id, dayIndex);
                cell.appendChild(marker);
            });

            // Drop target setup for markers
            const isFull = cellAssignments.length >= maxMarkers;
            if (isFull) cell.classList.add('cell-full');

            cell.addEventListener('dragover', (e) => {
                if (isFull || e.dataTransfer.types.includes('text/chore-id')) return;
                e.preventDefault();
                // If it's a move from within the grid (has JSON data), use 'move'
                // Otherwise (from palette), use 'copy'
                const isMove = e.dataTransfer.types.includes('application/json');
                e.dataTransfer.dropEffect = isMove ? 'move' : 'copy';
                cell.classList.add('drag-over');
            });
            cell.addEventListener('dragleave', () => {
                cell.classList.remove('drag-over');
            });
            cell.addEventListener('drop', (e) => {
                if (e.dataTransfer.types.includes('text/chore-id')) return;
                e.preventDefault();
                cell.classList.remove('drag-over');

                const actorId = parseInt(e.dataTransfer.getData('text/plain'), 10);
                if (!actorId) return;

                // Check if it's a move or new assignment
                const sourceData = e.dataTransfer.getData('application/json');

                if (sourceData) {
                    // Move from another cell
                    try {
                        const source = JSON.parse(sourceData);
                        // If same cell, do nothing
                        if (source.sourceChoreId === chore.id && source.sourceDayIndex === dayIndex) return;

                        // Try adding to new cell
                        const added = ChoreRepository.addAssignment(chore.id, dayIndex, actorId);
                        if (added) {
                            // If successful, remove from old cell
                            ChoreRepository.removeAssignment(source.sourceChoreId, source.sourceDayIndex, actorId);
                            renderBoard();
                        }
                    } catch (err) {
                        console.error('Invalid move data', err);
                    }
                } else {
                    // New assignment from palette
                    const added = ChoreRepository.addAssignment(chore.id, dayIndex, actorId);
                    if (added) renderBoard();
                }
            });

            board.appendChild(cell);
        });
    });
}

/**
 * Create a marker inside a grid cell — click to remove.
 */
function createCellMarker(actor, choreId, dayIndex) {
    const marker = document.createElement('div');
    marker.className = 'marker marker-cell';
    marker.style.backgroundColor = actor.color;
    marker.textContent = actor.initials;
    marker.title = `${actor.name} (drag to move, click to remove)`;
    marker.draggable = true;

    marker.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', String(actor.actorId));
        e.dataTransfer.setData('application/json', JSON.stringify({
            sourceChoreId: choreId,
            sourceDayIndex: dayIndex
        }));
        e.dataTransfer.effectAllowed = 'move';
        marker.classList.add('dragging');

        // Highlight valid targets
        document.querySelectorAll('.assignment-cell:not(.cell-full)').forEach(c => {
            c.classList.add('drop-target');
        });
    });

    marker.addEventListener('dragend', () => {
        marker.classList.remove('dragging');
        document.querySelectorAll('.drop-target').forEach(c => {
            c.classList.remove('drop-target');
        });
        document.querySelectorAll('.drag-over').forEach(c => {
            c.classList.remove('drag-over');
        });
    });

    marker.addEventListener('click', (e) => {
        e.stopPropagation();
        ChoreRepository.removeAssignment(choreId, dayIndex, actor.actorId);
        renderBoard();
    });
    return marker;
}

// ── Marker Palette ──────────────────────────────────────────

function renderPalette() {
    const container = document.getElementById('palette-markers');
    container.innerHTML = '';

    const people = ChoreRepository.getAllPeople();
    people.forEach(person => {
        const marker = document.createElement('div');
        marker.className = 'marker marker-palette';
        marker.style.backgroundColor = person.color;
        marker.textContent = person.initials;
        marker.title = `Drag ${person.name} to a cell`;
        marker.draggable = true;

        marker.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', String(person.id));
            e.dataTransfer.effectAllowed = 'copy';
            marker.classList.add('dragging');
            document.querySelectorAll('.assignment-cell:not(.cell-full)').forEach(c => {
                c.classList.add('drop-target');
            });
        });
        marker.addEventListener('dragend', () => {
            marker.classList.remove('dragging');
            document.querySelectorAll('.drop-target').forEach(c => {
                c.classList.remove('drop-target');
            });
            document.querySelectorAll('.drag-over').forEach(c => {
                c.classList.remove('drag-over');
            });
        });

        container.appendChild(marker);
    });

    // Render Groups in Palette (if enabled)
    const groups = ChoreRepository.getAllGroups();
    let visibleGroups = 0;
    groups.forEach(group => {
        if (!group.showAsMarker) return;
        visibleGroups++;

        const marker = document.createElement('div');
        marker.className = 'marker marker-palette marker-group';
        marker.style.backgroundColor = group.color;
        marker.textContent = group.initials;
        marker.title = `Group: ${group.name}`;
        marker.draggable = true;

        marker.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', String(group.id));
            e.dataTransfer.effectAllowed = 'copy';
            marker.classList.add('dragging');
            document.querySelectorAll('.assignment-cell:not(.cell-full)').forEach(c => {
                c.classList.add('drop-target');
            });
        });
        marker.addEventListener('dragend', () => {
            marker.classList.remove('dragging');
            document.querySelectorAll('.drop-target').forEach(c => {
                c.classList.remove('drop-target');
            });
            document.querySelectorAll('.drag-over').forEach(c => {
                c.classList.remove('drag-over');
            });
        });

        container.appendChild(marker);
    });

    if (!people.length && !visibleGroups) {
        container.innerHTML = '<span class="palette-empty">No people yet — add in Settings</span>';
    }
}

// ── Settings Modal ──────────────────────────────────────────

function openSettings() {
    const modal = document.getElementById('settings-modal');
    const select = document.getElementById('week-start-select');
    const titleInput = document.getElementById('chart-title-input');
    const subtitleInput = document.getElementById('chart-subtitle-input');
    const maxInput = document.getElementById('max-markers-input');
    const shadingCheck = document.getElementById('row-shading-check');
    const shadingColor = document.getElementById('row-shading-color');
    const colorRow = document.getElementById('row-shading-color-row');
    const choreWidthInput = document.getElementById('chore-width-input');

    select.value = ChoreRepository.getWeekStartDay();
    titleInput.value = ChoreRepository.getSetting('chart_title') || 'Chore Chart';
    subtitleInput.value = ChoreRepository.getSetting('chart_subtitle') || 'Digital Magnetic Board';
    maxInput.value = ChoreRepository.getMaxMarkersPerCell();
    choreWidthInput.value = ChoreRepository.getChoreColumnWidth();

    // Visuals
    shadingCheck.checked = ChoreRepository.getRowShadingEnabled();
    shadingColor.value = ChoreRepository.getRowShadingColor();

    // Toggle color picker visibility based on checkbox
    const toggleColor = () => {
        if (shadingCheck.checked) {
            colorRow.style.display = 'flex';
        } else {
            colorRow.style.display = 'none';
        }
    };
    toggleColor();
    shadingCheck.onclick = toggleColor;

    // ── Channel Switcher ──────────────────────────────────────
    const channelSelect = document.getElementById('channel-select');
    channelSelect.innerHTML = '';

    // Detect current channel from URL path
    // Path is like /chore_chart/ (stable) or /chore_chart/master/ (branch)
    const pathParts = window.location.pathname.replace(/\/$/, '').split('/');
    const repoBase = '/chore_chart';
    const afterBase = window.location.pathname.replace(repoBase, '').replace(/^\//, '').replace(/\/$/, '');
    const currentChannel = afterBase || 'stable';

    // Add a default option while loading
    const loadingOpt = document.createElement('option');
    loadingOpt.textContent = currentChannel === 'stable' ? '✦ Stable (release)' : currentChannel;
    loadingOpt.value = currentChannel;
    channelSelect.appendChild(loadingOpt);

    // Fetch branches.json to populate dynamically
    const baseUrl = window.location.origin + repoBase;
    fetch(baseUrl + '/branches.json?' + Date.now())
        .then(r => r.json())
        .then(branches => {
            channelSelect.innerHTML = '';
            branches.forEach(branch => {
                const opt = document.createElement('option');
                opt.value = branch;
                if (branch === 'stable') {
                    opt.textContent = '✦ Stable (release)';
                } else {
                    opt.textContent = branch;
                }
                if (branch === currentChannel) opt.selected = true;
                channelSelect.appendChild(opt);
            });
        })
        .catch(() => {
            // If fetch fails (local dev / offline), keep the single option
        });

    // Navigate on channel change
    channelSelect.onchange = () => {
        const selected = channelSelect.value;
        if (selected === currentChannel) return;
        if (selected === 'stable') {
            window.location.href = baseUrl + '/';
        } else {
            window.location.href = baseUrl + '/' + selected + '/';
        }
    };

    modal.classList.remove('hidden');
}

function closeSettings() {
    document.getElementById('settings-modal').classList.add('hidden');
}

function saveSettings() {
    const select = document.getElementById('week-start-select');
    const titleInput = document.getElementById('chart-title-input');
    const subtitleInput = document.getElementById('chart-subtitle-input');
    const maxInput = document.getElementById('max-markers-input');

    ChoreRepository.setWeekStartDay(select.value);
    ChoreRepository.setSetting('chart_title', titleInput.value.trim() || 'Chore Chart');
    ChoreRepository.setSetting('chart_subtitle', subtitleInput.value.trim() || 'Digital Magnetic Board');
    ChoreRepository.setMaxMarkersPerCell(parseInt(maxInput.value, 10));

    const shadingCheck = document.getElementById('row-shading-check');
    const shadingColor = document.getElementById('row-shading-color');
    const choreWidthInput = document.getElementById('chore-width-input');

    ChoreRepository.setRowShadingEnabled(shadingCheck.checked);
    ChoreRepository.setRowShadingColor(shadingColor.value);
    ChoreRepository.setChoreColumnWidth(parseInt(choreWidthInput.value, 10));

    closeSettings();
    renderHeader();
    renderBoard();
}

// ── People Manager ──────────────────────────────────────────

function renderPeopleList() {
    const container = document.getElementById('people-list');
    container.innerHTML = '';

    const people = ChoreRepository.getAllPeople();
    people.forEach(person => {
        const item = document.createElement('div');
        item.className = 'person-item-editable';

        // Color Input
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.className = 'color-input-sm';
        colorInput.value = person.color;
        colorInput.title = `Change color for ${person.name}`;
        colorInput.addEventListener('change', () => {
            ChoreRepository.updateActor(person.id, { color: colorInput.value });
            renderPalette();
            renderBoard();
        });

        // Name Input
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'text-input text-input-sm editable-name';
        nameInput.value = person.name;
        nameInput.maxLength = 128;
        nameInput.placeholder = 'Name';
        nameInput.addEventListener('change', () => {
            const newName = nameInput.value.trim();
            if (newName) {
                ChoreRepository.updateActor(person.id, { name: newName });
                renderPalette();
                renderBoard();
            } else {
                nameInput.value = person.name; // Revert
            }
        });

        // Initials Input
        const initialsInput = document.createElement('input');
        initialsInput.type = 'text';
        initialsInput.className = 'text-input text-input-sm editable-initials';
        initialsInput.value = person.initials;
        initialsInput.maxLength = 3;
        initialsInput.placeholder = 'AB';
        initialsInput.addEventListener('change', () => {
            const newInitials = initialsInput.value.trim().toUpperCase();
            if (newInitials) {
                ChoreRepository.updateActor(person.id, { initials: newInitials });
                initialsInput.value = newInitials;
                renderPalette();
                renderBoard();
            } else {
                initialsInput.value = person.initials; // Revert
            }
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete';
        deleteBtn.textContent = '✕';
        deleteBtn.title = `Remove ${person.name}`;
        deleteBtn.addEventListener('click', () => {
            if (confirm(`Remove ${person.name}? Their assignments will be cleared.`)) {
                ChoreRepository.removeActor(person.id);
                renderPeopleList();
                renderPalette();
                renderBoard();
            }
        });

        item.appendChild(colorInput);
        item.appendChild(nameInput);
        item.appendChild(initialsInput);
        item.appendChild(deleteBtn);
        container.appendChild(item);
    });
}

// ── Groups Manager ──────────────────────────────────────────

function renderGroupsList() {
    const container = document.getElementById('groups-list');
    if (!container) return; // Guard if element missing
    container.innerHTML = '';

    const groups = ChoreRepository.getAllGroups();
    const people = ChoreRepository.getAllPeople();

    groups.forEach(group => {
        const item = document.createElement('div');
        item.className = 'group-item-editable';
        // Add specific style for group items (e.g. border or background)
        item.style.marginBottom = '12px';
        item.style.padding = '10px';
        item.style.border = '1px solid var(--border)';
        item.style.borderRadius = '8px';
        item.style.background = 'rgba(255, 255, 255, 0.02)';

        // Header Row: Color | Name | Initials | Delete
        const headerRow = document.createElement('div');
        headerRow.style.display = 'flex';
        headerRow.style.gap = '8px';
        headerRow.style.alignItems = 'center';
        headerRow.style.marginBottom = '8px';

        // Color
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.className = 'color-input-sm';
        colorInput.value = group.color;
        colorInput.addEventListener('change', () => {
            ChoreRepository.updateGroup(group.id, { color: colorInput.value });
            renderPalette();
            renderBoard();
        });

        // Name
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'text-input text-input-sm';
        nameInput.value = group.name;
        nameInput.placeholder = 'Group Name';
        nameInput.addEventListener('change', () => {
            const val = nameInput.value.trim();
            if (val) {
                ChoreRepository.updateGroup(group.id, { name: val });
                renderPalette();
                renderBoard();
            } else {
                nameInput.value = group.name;
            }
        });

        // Initials
        const initialsInput = document.createElement('input');
        initialsInput.type = 'text';
        initialsInput.className = 'text-input text-input-sm';
        initialsInput.value = group.initials;
        initialsInput.placeholder = 'GRP';
        initialsInput.maxLength = 3;
        initialsInput.style.width = '50px';
        initialsInput.addEventListener('change', () => {
            const val = initialsInput.value.trim().toUpperCase();
            if (val) {
                ChoreRepository.updateGroup(group.id, { initials: val });
                renderPalette();
                renderBoard();
            } else {
                initialsInput.value = group.initials;
            }
        });

        // Delete
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete';
        deleteBtn.textContent = '✕';
        deleteBtn.addEventListener('click', () => {
            if (confirm(`Remove group "${group.name}"?`)) {
                ChoreRepository.removeActor(group.id);
                renderGroupsList();
                renderPalette();
                renderBoard();
            }
        });

        headerRow.appendChild(colorInput);
        headerRow.appendChild(nameInput);
        headerRow.appendChild(initialsInput);
        headerRow.appendChild(deleteBtn);
        item.appendChild(headerRow);

        // Options Row: Show as Marker | Membership
        const optionsRow = document.createElement('div');
        optionsRow.style.display = 'flex';
        optionsRow.style.flexDirection = 'column';
        optionsRow.style.gap = '8px';
        optionsRow.style.fontSize = '0.9rem';

        // Toggle Marker
        const markerLabel = document.createElement('label');
        markerLabel.style.display = 'flex';
        markerLabel.style.alignItems = 'center';
        markerLabel.style.gap = '6px';
        markerLabel.style.cursor = 'pointer';

        const markerCheck = document.createElement('input');
        markerCheck.type = 'checkbox';
        markerCheck.checked = group.showAsMarker;
        markerCheck.addEventListener('change', () => {
            ChoreRepository.updateGroup(group.id, { showAsMarker: markerCheck.checked });
            renderPalette();
        });

        markerLabel.appendChild(markerCheck);
        markerLabel.appendChild(document.createTextNode('Show this marker'));
        optionsRow.appendChild(markerLabel);

        // Members Selection
        const membersLabel = document.createElement('div');
        membersLabel.textContent = 'Members:';
        membersLabel.style.fontWeight = '500';
        membersLabel.style.marginTop = '4px';
        optionsRow.appendChild(membersLabel);

        const membersContainer = document.createElement('div');
        membersContainer.style.display = 'flex';
        membersContainer.style.flexWrap = 'wrap';
        membersContainer.style.gap = '6px';

        people.forEach(person => {
            const isMember = group.memberIds.includes(person.id);
            const chip = document.createElement('div');
            chip.textContent = person.initials;
            chip.title = person.name;
            chip.style.padding = '2px 6px';
            chip.style.borderRadius = '4px';
            chip.style.fontSize = '0.8rem';
            chip.style.cursor = 'pointer';
            chip.style.border = `1px solid ${person.color}`;

            if (isMember) {
                chip.style.backgroundColor = person.color;
                chip.style.color = '#fff';
            } else {
                chip.style.backgroundColor = 'transparent';
                chip.style.color = 'var(--text)';
            }

            chip.addEventListener('click', () => {
                let newMembers = [...group.memberIds];
                if (isMember) {
                    newMembers = newMembers.filter(id => id !== person.id);
                } else {
                    newMembers.push(person.id);
                }
                ChoreRepository.updateGroup(group.id, { memberIds: newMembers });
                renderGroupsList();
            });

            membersContainer.appendChild(chip);
        });

        // Separator if we have groups to show
        const eligibleGroups = groups.filter(g => g.id !== group.id && ChoreRepository.canAddMember(group.id, g.id));
        const memberGroups = groups.filter(g => g.id !== group.id && group.memberIds.includes(g.id));

        // Combine for display: show matches or currently added ones (even if invalid now, though that shouldn't happen)
        // Actually, just show all eligible candidates + current members
        // To simplify: show ALL groups, disable invalid ones.

        if (groups.length > 1) {
            const divider = document.createElement('div');
            divider.style.width = '100%';
            divider.style.height = '1px';
            divider.style.background = 'var(--border)';
            divider.style.margin = '4px 0';
            membersContainer.appendChild(divider);

            groups.forEach(g => {
                if (g.id === group.id) return; // Skip self

                const isMember = group.memberIds.includes(g.id);
                const canAdd = ChoreRepository.canAddMember(group.id, g.id);

                if (!isMember && !canAdd) return; // Hide invalid candidates

                const chip = document.createElement('div');
                chip.textContent = g.initials;
                chip.title = `Group: ${g.name}`;
                chip.style.padding = '2px 6px';
                chip.style.borderRadius = '4px';
                chip.style.fontSize = '0.8rem';
                chip.style.cursor = 'pointer';
                // Dashed border for groups to distinguish
                chip.style.border = `1px dashed ${g.color}`;
                chip.style.fontWeight = 'bold';

                if (isMember) {
                    chip.style.backgroundColor = g.color;
                    chip.style.color = '#fff';
                    chip.style.borderStyle = 'solid';
                } else {
                    chip.style.backgroundColor = 'transparent';
                    chip.style.color = 'var(--text)';
                }

                chip.addEventListener('click', () => {
                    let newMembers = [...group.memberIds];
                    if (isMember) {
                        newMembers = newMembers.filter(id => id !== g.id);
                        ChoreRepository.updateGroup(group.id, { memberIds: newMembers });
                        renderGroupsList();
                    } else {
                        if (canAdd) {
                            newMembers.push(g.id);
                            ChoreRepository.updateGroup(group.id, { memberIds: newMembers });
                            renderGroupsList();
                        } else {
                            alert('Cannot add this group: Max nesting level (3) exceeded or circular dependency.');
                        }
                    }
                });

                membersContainer.appendChild(chip);
            });
        }

        optionsRow.appendChild(membersContainer);
        item.appendChild(optionsRow);
        container.appendChild(item);
    });

    if (!groups.length) {
        container.innerHTML = '<div style="color: var(--text-secondary); font-size: 0.85rem; padding: 8px 0;">No groups added yet.</div>';
    }
}

function addGroup() {
    const nameInput = document.getElementById('new-group-name');
    const initialsInput = document.getElementById('new-group-initials');
    const colorInput = document.getElementById('new-group-color');

    const name = nameInput.value.trim();
    const initials = initialsInput.value.trim().toUpperCase();
    const color = colorInput.value;

    if (!name) { nameInput.focus(); return; }
    if (!initials) { initialsInput.focus(); return; }

    ChoreRepository.addGroup(name, initials, color);
    nameInput.value = '';
    initialsInput.value = '';

    // Rotate to a new default color
    const colors = ['#00cec9', '#fab1a0', '#00b894', '#fd79a8', '#6c5ce7', '#ffeaa7'];
    const groups = ChoreRepository.getAllGroups();
    colorInput.value = colors[groups.length % colors.length];

    renderGroupsList();
    renderPalette();
    renderBoard();
}

function addPerson() {
    const nameInput = document.getElementById('new-person-name');
    const initialsInput = document.getElementById('new-person-initials');
    const colorInput = document.getElementById('new-person-color');

    const name = nameInput.value.trim();
    const initials = initialsInput.value.trim().toUpperCase();
    const color = colorInput.value;

    if (!name) { nameInput.focus(); return; }
    if (!initials) { initialsInput.focus(); return; }

    ChoreRepository.addPerson(name, initials, color);
    nameInput.value = '';
    initialsInput.value = '';

    // Rotate to a new default color
    const colors = ['#6c5ce7', '#0984e3', '#00b894', '#fdcb6e', '#e17055', '#d63031', '#a29bfe'];
    const people = ChoreRepository.getAllPeople();
    colorInput.value = colors[people.length % colors.length];

    renderPeopleList();
    renderPalette();
    renderBoard();
}

// ── Event Binding ───────────────────────────────────────────

// ── Rotation Modal ──────────────────────────────────────────

function openRotationModal(choreId) {
    const overlay = document.getElementById('rotation-modal-overlay');
    document.getElementById('rotation-chore-id').value = choreId;

    // Populate group dropdown
    const groupSelect = document.getElementById('rotation-group-select');
    groupSelect.innerHTML = '';
    const groups = ChoreRepository.getAllGroups();
    if (!groups.length) {
        alert('No groups defined. Create a group in the Members menu first.');
        return;
    }
    groups.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g.id;
        opt.textContent = g.name;
        groupSelect.appendChild(opt);
    });

    // Populate day dropdown
    const daySelect = document.getElementById('rotation-day-select');
    daySelect.innerHTML = '';
    const orderedDays = getOrderedDays();
    orderedDays.forEach(day => {
        const opt = document.createElement('option');
        opt.value = ALL_DAYS.indexOf(day);
        opt.textContent = day;
        daySelect.appendChild(opt);
    });

    // Populate member dropdown based on selected group
    populateRotationMembers();
    groupSelect.addEventListener('change', populateRotationMembers);

    overlay.classList.remove('hidden');
}

function populateRotationMembers() {
    const groupId = parseInt(document.getElementById('rotation-group-select').value, 10);
    const memberSelect = document.getElementById('rotation-member-select');
    memberSelect.innerHTML = '';
    const members = ChoreRepository.getGroupMembers(groupId);
    if (!members.length) {
        const opt = document.createElement('option');
        opt.textContent = '(no members)';
        opt.disabled = true;
        memberSelect.appendChild(opt);
        return;
    }
    members.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.name;
        memberSelect.appendChild(opt);
    });
}

function closeRotationModal() {
    document.getElementById('rotation-modal-overlay').classList.add('hidden');
}

function applyRotation() {
    const choreId = parseInt(document.getElementById('rotation-chore-id').value, 10);
    const groupId = parseInt(document.getElementById('rotation-group-select').value, 10);
    const startMemberId = parseInt(document.getElementById('rotation-member-select').value, 10);
    const startDayIndex = parseInt(document.getElementById('rotation-day-select').value, 10);

    ChoreRepository.assignGroupRotation(choreId, groupId, startMemberId, startDayIndex);
    closeRotationModal();
    renderBoard();
}

// ── Event Binding ───────────────────────────────────────────

function bindEvents() {
    document.getElementById('reset-board-btn').addEventListener('click', () => {
        if (confirm('Clear all assignments for the week?')) {
            ChoreRepository.clearAllAssignments();
            closeSettings();
            renderBoard();
        }
    });

    // Settings
    document.getElementById('settings-btn').addEventListener('click', openSettings);
    document.getElementById('settings-close-btn').addEventListener('click', closeSettings);
    document.getElementById('settings-save-btn').addEventListener('click', saveSettings);

    // Close modal on overlay click
    document.getElementById('settings-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('settings-modal')) closeSettings();
    });

    // Members Modal
    const membersModal = document.getElementById('members-modal-overlay');

    function openMembers() {
        renderPeopleList();
        renderGroupsList();
        membersModal.classList.remove('hidden');
    }

    function closeMembers() {
        membersModal.classList.add('hidden');
    }

    document.getElementById('members-btn').addEventListener('click', openMembers);
    document.getElementById('members-close-btn').addEventListener('click', closeMembers);
    document.getElementById('members-done-btn').addEventListener('click', closeMembers);

    membersModal.addEventListener('click', (e) => {
        if (e.target === membersModal) closeMembers();
    });

    // Rotation Modal
    const rotationOverlay = document.getElementById('rotation-modal-overlay');
    document.getElementById('rotation-close-btn').addEventListener('click', closeRotationModal);
    document.getElementById('rotation-cancel-btn').addEventListener('click', closeRotationModal);
    document.getElementById('rotation-apply-btn').addEventListener('click', applyRotation);
    rotationOverlay.addEventListener('click', (e) => {
        if (e.target === rotationOverlay) closeRotationModal();
    });

    // People Manager
    document.getElementById('add-person-btn').addEventListener('click', addPerson);

    // Group Manager
    const addGroupBtn = document.getElementById('add-group-btn');
    if (addGroupBtn) {
        addGroupBtn.addEventListener('click', addGroup);
    }

    // Enter key in add-person form
    document.getElementById('new-person-initials').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addPerson();
    });
    document.getElementById('new-person-name').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') document.getElementById('new-person-initials').focus();
    });
}

document.addEventListener('DOMContentLoaded', init);
