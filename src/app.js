/**
 * Chore Chart - App Logic
 *
 * This module handles all UI rendering and user interaction.
 * It relies exclusively on ChoreRepository (repository.js) for data access.
 */

function tryVibrate(pattern) {
    console.log('Vibrate called with pattern:', pattern);
    if (navigator.vibrate) {
        try {
            navigator.vibrate(pattern);
        } catch (e) {
            console.error('Vibrate failed:', e);
        }
    } else {
        console.warn('navigator.vibrate not supported');
    }
}

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
let sortDirection = 'asc'; // 'asc' or 'desc'

/**
 * Returns the 7-day array rotated so that `startDay` is first.
 */
async function getOrderedDays() {
    const startDay = await ChoreRepository.getWeekStartDay();
    const startIndex = ALL_DAYS.indexOf(startDay);
    if (startIndex <= 0) return [...ALL_DAYS];
    return [...ALL_DAYS.slice(startIndex), ...ALL_DAYS.slice(0, startIndex)];
}

async function init() {
    await initDatabase();
    await renderHeader();
    await renderBoard();
    await renderPalette();
    bindEvents();
}

/**
 * Renders the chart title and subtitle from settings.
 */
async function renderHeader() {
    const title = (await ChoreRepository.getSetting('chart_title')) || 'Chore Chart';
    const subtitle =
        (await ChoreRepository.getSetting('chart_subtitle')) || 'Digital Magnetic Board';
    document.getElementById('chart-title').textContent = title;
    document.getElementById('chart-subtitle').textContent = subtitle;
    document.title = `${title} - ${subtitle}`;
}

// ── Board Rendering ─────────────────────────────────────────

async function renderBoard() {
    const board = document.getElementById('chore-board');
    board.innerHTML = '';

    const orderedDays = await getOrderedDays();
    const chores = await ChoreRepository.getAllChores();
    const assignments = await ChoreRepository.getAllAssignments();
    const maxMarkers = await ChoreRepository.getMaxMarkersPerCell();
    const shadingEnabled = await ChoreRepository.getRowShadingEnabled();
    const shadeColor = await ChoreRepository.getRowShadingColor();
    const choreColWidth = await ChoreRepository.getChoreColumnWidth();

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
    addBtn.addEventListener('click', async () => {
        const name = prompt('Enter chore name:');
        if (name && name.trim()) {
            await ChoreRepository.addChore(name.trim());
            await renderBoard();
        }
    });
    corner.appendChild(addBtn);

    const sortBtn = document.createElement('button');
    sortBtn.className = 'sort-chore-btn';
    sortBtn.innerHTML = sortDirection === 'asc' ? '↓' : '↑';
    sortBtn.title = `Sort Chores (${sortDirection === 'asc' ? 'A-Z' : 'Z-A'})`;
    sortBtn.addEventListener('click', async () => {
        const currentChores = await ChoreRepository.getAllChores();
        currentChores.sort((a, b) => {
            if (sortDirection === 'asc') {
                return a.name.localeCompare(b.name);
            } else {
                return b.name.localeCompare(a.name);
            }
        });

        const orderedIds = currentChores.map((c) => c.id);
        await ChoreRepository.updateChoreOrders(orderedIds);

        // Toggle direction for next click
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        await renderBoard();
    });
    corner.appendChild(sortBtn);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    const handleResizeStart = async (e) => {
        if (e.type !== 'touchstart') e.preventDefault();
        const startX = e.type === 'touchstart' ? e.touches[0].pageX : e.pageX;
        const startWidth = await ChoreRepository.getChoreColumnWidth();
        resizeHandle.classList.add('resizing');

        const onMove = async (moveEvent) => {
            if (moveEvent.cancelable) moveEvent.preventDefault();
            const currentX = moveEvent.type.includes('touch')
                ? moveEvent.touches[0].pageX
                : moveEvent.pageX;
            const newWidth = Math.max(100, Math.min(600, startWidth + (currentX - startX)));
            board.style.setProperty('--chore-col-width', `${newWidth}px`);
            await ChoreRepository.setChoreColumnWidth(newWidth);
        };

        const onEnd = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onEnd);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);
            document.removeEventListener('touchcancel', onEnd);
            resizeHandle.classList.remove('resizing');
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
        document.addEventListener('touchcancel', onEnd);
    };

    resizeHandle.addEventListener('mousedown', handleResizeStart);
    resizeHandle.addEventListener('touchstart', handleResizeStart, { passive: false });
    corner.appendChild(resizeHandle);

    board.appendChild(corner);

    for (const day of orderedDays) {
        const header = document.createElement('div');
        header.className = 'board-cell header';
        header.textContent = day;
        board.appendChild(header);
    }

    // ── Chore Rows ──
    for (let index = 0; index < chores.length; index++) {
        const chore = chores[index];
        const isShaded = shadingEnabled && index % 2 !== 0;

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
        nameInput.addEventListener('change', async () => {
            const newName = nameInput.value.trim();
            if (newName && newName !== chore.name) {
                await ChoreRepository.updateChore(chore.id, { name: newName });
                await renderBoard();
            } else {
                nameInput.value = chore.name;
            }
        });
        nameCell.appendChild(nameInput);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'chore-delete-btn';
        deleteBtn.textContent = '×';
        deleteBtn.title = `Delete ${chore.name}`;
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm(`Delete "${chore.name}" and all its assignments?`)) {
                await ChoreRepository.removeChore(chore.id);
                await renderBoard();
            }
        });
        nameCell.appendChild(deleteBtn);

        // Rotate button
        const rotateBtn = document.createElement('button');
        rotateBtn.className = 'chore-rotate-btn';
        rotateBtn.textContent = '🔄';
        rotateBtn.title = `Rotate group assignment for ${chore.name}`;
        rotateBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            openRotationModal(chore.id);
        });
        nameCell.appendChild(rotateBtn);

        // Drag events for reordering chores
        nameCell.addEventListener('dragstart', async (e) => {
            tryVibrate(50);
            e.dataTransfer.setData('text/chore-id', String(chore.id));
            e.dataTransfer.effectAllowed = 'move';
            nameCell.classList.add('dragging-chore');
        });

        nameCell.addEventListener('dragend', async () => {
            nameCell.classList.remove('dragging-chore');
            document
                .querySelectorAll('.chore-name')
                .forEach((c) => c.classList.remove('drag-over-chore'));
        });

        nameCell.addEventListener('dragover', async (e) => {
            if (e.dataTransfer.types.includes('text/chore-id')) {
                e.preventDefault();
                nameCell.classList.add('drag-over-chore');
            }
        });

        nameCell.addEventListener('dragleave', async () => {
            nameCell.classList.remove('drag-over-chore');
        });

        nameCell.addEventListener('drop', async (e) => {
            const draggedId = parseInt(e.dataTransfer.getData('text/chore-id'), 10);
            if (!draggedId || draggedId === chore.id) return;

            e.preventDefault();
            tryVibrate([30, 50, 30]);
            const currentIds = chores.map((c) => c.id);
            const fromIndex = currentIds.indexOf(draggedId);
            const toIndex = currentIds.indexOf(chore.id);

            // Reorder the array
            currentIds.splice(fromIndex, 1);
            currentIds.splice(toIndex, 0, draggedId);

            await ChoreRepository.updateChoreOrders(currentIds);
            await renderBoard();
        });

        board.appendChild(nameCell);

        for (const day of orderedDays) {
            const dayIndex = ALL_DAYS.indexOf(day);
            const cell = document.createElement('div');
            cell.className = 'board-cell assignment-cell';
            if (isShaded) cell.classList.add('board-row-shaded');
            cell.dataset.choreId = chore.id;
            cell.dataset.dayIndex = dayIndex;

            const key = `${chore.id}-${dayIndex}`;
            const cellAssignments = assignments[key] || [];

            // Render markers in cell
            cellAssignments.forEach((a) => {
                const marker = createCellMarker(a, chore.id, dayIndex);
                cell.appendChild(marker);
            });

            // Drop target setup for markers
            const isFull = cellAssignments.length >= maxMarkers;
            if (isFull) cell.classList.add('cell-full');

            cell.addEventListener('dragover', async (e) => {
                if (isFull || e.dataTransfer.types.includes('text/chore-id')) return;
                e.preventDefault();
                // If it's a move from within the grid (has JSON data), use 'move'
                // Otherwise (from palette), use 'copy'
                const isMove = e.dataTransfer.types.includes('application/json');
                e.dataTransfer.dropEffect = isMove ? 'move' : 'copy';
                cell.classList.add('drag-over');
            });
            cell.addEventListener('dragleave', async () => {
                cell.classList.remove('drag-over');
            });
            cell.addEventListener('drop', async (e) => {
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
                        if (source.sourceChoreId === chore.id && source.sourceDayIndex === dayIndex)
                            return;

                        // Try adding to new cell
                        const added = await ChoreRepository.addAssignment(
                            chore.id,
                            dayIndex,
                            actorId
                        );
                        if (added) {
                            tryVibrate([30, 50, 30]);
                            // If successful, remove from old cell
                            await ChoreRepository.removeAssignment(
                                source.sourceChoreId,
                                source.sourceDayIndex,
                                actorId
                            );
                            await renderBoard();
                        }
                    } catch (err) {
                        console.error('Invalid move data', err);
                    }
                } else {
                    // New assignment from palette
                    const added = await ChoreRepository.addAssignment(chore.id, dayIndex, actorId);
                    if (added) {
                        tryVibrate([30, 50, 30]);
                        await renderBoard();
                    }
                }
            });

            board.appendChild(cell);
        }
    }
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

    marker.addEventListener('dragstart', async (e) => {
        tryVibrate(50);
        e.dataTransfer.setData('text/plain', String(actor.actorId));
        e.dataTransfer.setData(
            'application/json',
            JSON.stringify({
                sourceChoreId: choreId,
                sourceDayIndex: dayIndex
            })
        );
        e.dataTransfer.effectAllowed = 'move';
        marker.classList.add('dragging');

        // Highlight valid targets
        document.querySelectorAll('.assignment-cell:not(.cell-full)').forEach((c) => {
            c.classList.add('drop-target');
        });
    });

    marker.addEventListener('dragend', async () => {
        marker.classList.remove('dragging');
        document.querySelectorAll('.drop-target').forEach((c) => {
            c.classList.remove('drop-target');
        });
        document.querySelectorAll('.drag-over').forEach((c) => {
            c.classList.remove('drag-over');
        });
    });

    marker.addEventListener('click', async (e) => {
        e.stopPropagation();
        await ChoreRepository.removeAssignment(choreId, dayIndex, actor.actorId);
        await renderBoard();
    });
    return marker;
}

// ── Marker Palette ──────────────────────────────────────────

async function renderPalette() {
    const container = document.getElementById('palette-markers');
    container.innerHTML = '';

    const people = await ChoreRepository.getAllPeople();
    for (const person of people) {
        const marker = document.createElement('div');
        marker.className = 'marker marker-palette';
        marker.style.backgroundColor = person.color;
        marker.textContent = person.initials;
        marker.title = `Drag ${person.name} to a cell`;
        marker.draggable = true;

        marker.addEventListener('dragstart', async (e) => {
            tryVibrate(50);
            e.dataTransfer.setData('text/plain', String(person.id));
            e.dataTransfer.effectAllowed = 'copy';
            marker.classList.add('dragging');
            document.querySelectorAll('.assignment-cell:not(.cell-full)').forEach((c) => {
                c.classList.add('drop-target');
            });
        });
        marker.addEventListener('dragend', async () => {
            marker.classList.remove('dragging');
            document.querySelectorAll('.drop-target').forEach((c) => {
                c.classList.remove('drop-target');
            });
            document.querySelectorAll('.drag-over').forEach((c) => {
                c.classList.remove('drag-over');
            });
        });

        container.appendChild(marker);
    }

    // Render Groups in Palette (if enabled)
    const groups = await ChoreRepository.getAllGroups();
    let visibleGroups = 0;
    for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        if (!group.showAsMarker) return;
        visibleGroups++;

        const marker = document.createElement('div');
        marker.className = 'marker marker-palette marker-group';
        marker.style.backgroundColor = group.color;
        marker.textContent = group.initials;
        marker.title = `Group: ${group.name}`;
        marker.draggable = true;

        marker.addEventListener('dragstart', async (e) => {
            tryVibrate(50);
            e.dataTransfer.setData('text/plain', String(group.id));
            e.dataTransfer.effectAllowed = 'copy';
            marker.classList.add('dragging');
            document.querySelectorAll('.assignment-cell:not(.cell-full)').forEach((c) => {
                c.classList.add('drop-target');
            });
        });
        marker.addEventListener('dragend', async () => {
            marker.classList.remove('dragging');
            document.querySelectorAll('.drop-target').forEach((c) => {
                c.classList.remove('drop-target');
            });
            document.querySelectorAll('.drag-over').forEach((c) => {
                c.classList.remove('drag-over');
            });
        });

        container.appendChild(marker);
    }

    if (!people.length && !visibleGroups) {
        container.innerHTML = '<span class="palette-empty">No people yet — add in Settings</span>';
    }
}

// ── Settings Modal ──────────────────────────────────────────

async function openSettings() {
    const modal = document.getElementById('settings-modal');
    const select = document.getElementById('week-start-select');
    const titleInput = document.getElementById('chart-title-input');
    const subtitleInput = document.getElementById('chart-subtitle-input');
    const maxInput = document.getElementById('max-markers-input');
    const shadingCheck = document.getElementById('row-shading-check');
    const shadingColor = document.getElementById('row-shading-color');
    const colorRow = document.getElementById('row-shading-color-row');
    const choreWidthInput = document.getElementById('chore-width-input');

    select.value = await ChoreRepository.getWeekStartDay();
    titleInput.value = (await ChoreRepository.getSetting('chart_title')) || 'Chore Chart';
    subtitleInput.value =
        (await ChoreRepository.getSetting('chart_subtitle')) || 'Digital Magnetic Board';
    maxInput.value = await ChoreRepository.getMaxMarkersPerCell();
    choreWidthInput.value = await ChoreRepository.getChoreColumnWidth();

    // Visuals
    shadingCheck.checked = await ChoreRepository.getRowShadingEnabled();
    shadingColor.value = await ChoreRepository.getRowShadingColor();

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
    const repoBase = '/chore_chart';
    const afterBase = window.location.pathname
        .replace(repoBase, '')
        .replace(/^\//, '')
        .replace(/\/$/, '');
    const currentChannel = afterBase || 'stable';

    // Add a default option while loading
    const loadingOpt = document.createElement('option');
    loadingOpt.textContent = currentChannel === 'stable' ? '✦ Stable (release)' : currentChannel;
    loadingOpt.value = currentChannel;
    channelSelect.appendChild(loadingOpt);

    // Fetch branches.json to populate dynamically
    const baseUrl = window.location.origin + repoBase;
    let availableBranches = [currentChannel];

    fetch(baseUrl + '/branches.json?' + Date.now())
        .then((r) => r.json())
        .then((branches) => {
            availableBranches = Array.isArray(branches) ? branches.slice() : [];
            channelSelect.innerHTML = '';
            availableBranches.forEach((branch) => {
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

    // Navigate on channel change (allow-list validated)
    channelSelect.onchange = () => {
        const selected = channelSelect.value;
        if (selected === currentChannel) return;
        // Only allow navigation to known-safe branches
        if (!availableBranches.includes(selected)) return;
        if (selected === 'stable') {
            window.location.href = baseUrl + '/';
        } else {
            window.location.href = baseUrl + '/' + selected + '/';
        }
    };

    modal.classList.remove('hidden');
}

async function closeSettings() {
    document.getElementById('settings-modal').classList.add('hidden');
}

async function saveSettings() {
    const select = document.getElementById('week-start-select');
    const titleInput = document.getElementById('chart-title-input');
    const subtitleInput = document.getElementById('chart-subtitle-input');
    const maxInput = document.getElementById('max-markers-input');

    await ChoreRepository.setWeekStartDay(select.value);
    await ChoreRepository.setSetting('chart_title', titleInput.value.trim() || 'Chore Chart');
    await ChoreRepository.setSetting(
        'chart_subtitle',
        subtitleInput.value.trim() || 'Digital Magnetic Board'
    );
    await ChoreRepository.setMaxMarkersPerCell(parseInt(maxInput.value, 10));

    const shadingCheck = document.getElementById('row-shading-check');
    const shadingColor = document.getElementById('row-shading-color');
    const choreWidthInput = document.getElementById('chore-width-input');

    await ChoreRepository.setRowShadingEnabled(shadingCheck.checked);
    await ChoreRepository.setRowShadingColor(shadingColor.value);
    await ChoreRepository.setChoreColumnWidth(parseInt(choreWidthInput.value, 10));

    closeSettings();
    await renderHeader();
    await renderBoard();
}

// ── People Manager ──────────────────────────────────────────

async function renderPeopleList() {
    const container = document.getElementById('people-list');
    container.innerHTML = '';

    const people = await ChoreRepository.getAllPeople();
    for (const person of people) {
        const item = document.createElement('div');
        item.className = 'person-item-editable';

        // Color Input
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.className = 'color-input-sm';
        colorInput.value = person.color;
        colorInput.title = `Change color for ${person.name}`;
        colorInput.addEventListener('change', async () => {
            await ChoreRepository.updateActor(person.id, { color: colorInput.value });
            await renderPalette();
            await renderBoard();
        });

        // Name Input
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'text-input text-input-sm editable-name';
        nameInput.value = person.name;
        nameInput.maxLength = 128;
        nameInput.placeholder = 'Name';
        nameInput.addEventListener('change', async () => {
            const newName = nameInput.value.trim();
            if (newName) {
                await ChoreRepository.updateActor(person.id, { name: newName });
                await renderPalette();
                await renderBoard();
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
        initialsInput.addEventListener('change', async () => {
            const newInitials = initialsInput.value.trim().toUpperCase();
            if (newInitials) {
                await ChoreRepository.updateActor(person.id, { initials: newInitials });
                initialsInput.value = newInitials;
                await renderPalette();
                await renderBoard();
            } else {
                initialsInput.value = person.initials; // Revert
            }
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete';
        deleteBtn.textContent = '✕';
        deleteBtn.title = `Remove ${person.name}`;
        deleteBtn.addEventListener('click', async () => {
            if (confirm(`Remove ${person.name}? Their assignments will be cleared.`)) {
                await ChoreRepository.removeActor(person.id);
                renderPeopleList();
                await renderPalette();
                await renderBoard();
            }
        });

        item.appendChild(colorInput);
        item.appendChild(nameInput);
        item.appendChild(initialsInput);
        item.appendChild(deleteBtn);
        container.appendChild(item);
    }
}

// ── Groups Manager ──────────────────────────────────────────

async function renderGroupsList() {
    const container = document.getElementById('groups-list');
    if (!container) return; // Guard if element missing
    container.innerHTML = '';

    const groups = await ChoreRepository.getAllGroups();
    const people = await ChoreRepository.getAllPeople();

    for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
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
        colorInput.addEventListener('change', async () => {
            await ChoreRepository.updateGroup(group.id, { color: colorInput.value });
            await renderPalette();
            await renderBoard();
        });

        // Name
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'text-input text-input-sm';
        nameInput.value = group.name;
        nameInput.placeholder = 'Group Name';
        nameInput.addEventListener('change', async () => {
            const val = nameInput.value.trim();
            if (val) {
                await ChoreRepository.updateGroup(group.id, { name: val });
                await renderPalette();
                await renderBoard();
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
        initialsInput.addEventListener('change', async () => {
            const val = initialsInput.value.trim().toUpperCase();
            if (val) {
                await ChoreRepository.updateGroup(group.id, { initials: val });
                await renderPalette();
                await renderBoard();
            } else {
                initialsInput.value = group.initials;
            }
        });

        // Delete
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete';
        deleteBtn.textContent = '✕';
        deleteBtn.addEventListener('click', async () => {
            if (confirm(`Remove group "${group.name}"?`)) {
                await ChoreRepository.removeActor(group.id);
                renderGroupsList();
                await renderPalette();
                await renderBoard();
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
        markerCheck.addEventListener('change', async () => {
            await ChoreRepository.updateGroup(group.id, { showAsMarker: markerCheck.checked });
            await renderPalette();
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

        for (const person of people) {
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

            chip.addEventListener('click', async () => {
                let newMembers = [...group.memberIds];
                if (isMember) {
                    newMembers = newMembers.filter((id) => id !== person.id);
                } else {
                    newMembers.push(person.id);
                }
                await ChoreRepository.updateGroup(group.id, { memberIds: newMembers });
                renderGroupsList();
            });

            membersContainer.appendChild(chip);
        }

        // Separator if we have groups to show
        const eligibleGroups = [];
        for (const g of groups) {
            if (g.id !== group.id && (await ChoreRepository.canAddMember(group.id, g.id))) {
                eligibleGroups.push(g);
            }
        }

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

            for (const g of groups) {
                if (g.id === group.id) return; // Skip self

                const isMember = group.memberIds.includes(g.id);
                const canAdd = await ChoreRepository.canAddMember(group.id, g.id);

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

                chip.addEventListener('click', async () => {
                    let newMembers = [...group.memberIds];
                    if (isMember) {
                        newMembers = newMembers.filter((id) => id !== g.id);
                        await ChoreRepository.updateGroup(group.id, { memberIds: newMembers });
                        renderGroupsList();
                    } else {
                        if (canAdd) {
                            newMembers.push(g.id);
                            await ChoreRepository.updateGroup(group.id, { memberIds: newMembers });
                            renderGroupsList();
                        } else {
                            alert(
                                'Cannot add this group: Max nesting level (3) exceeded or circular dependency.'
                            );
                        }
                    }
                });

                membersContainer.appendChild(chip);
            }
        }

        optionsRow.appendChild(membersContainer);
        item.appendChild(optionsRow);
        container.appendChild(item);
    }

    if (!groups.length) {
        container.innerHTML =
            '<div style="color: var(--text-secondary); font-size: 0.85rem; padding: 8px 0;">No groups added yet.</div>';
    }
}

async function addGroup() {
    const nameInput = document.getElementById('new-group-name');
    const initialsInput = document.getElementById('new-group-initials');
    const colorInput = document.getElementById('new-group-color');

    const name = nameInput.value.trim();
    const initials = initialsInput.value.trim().toUpperCase();
    const color = colorInput.value;

    if (!name) {
        nameInput.focus();
        return;
    }
    if (!initials) {
        initialsInput.focus();
        return;
    }

    await ChoreRepository.addGroup(name, initials, color);
    nameInput.value = '';
    initialsInput.value = '';

    // Rotate to a new default color
    const colors = ['#00cec9', '#fab1a0', '#00b894', '#fd79a8', '#6c5ce7', '#ffeaa7'];
    const groups = await ChoreRepository.getAllGroups();
    colorInput.value = colors[groups.length % colors.length];

    renderGroupsList();
    await renderPalette();
    await renderBoard();
}

async function addPerson() {
    const nameInput = document.getElementById('new-person-name');
    const initialsInput = document.getElementById('new-person-initials');
    const colorInput = document.getElementById('new-person-color');

    const name = nameInput.value.trim();
    const initials = initialsInput.value.trim().toUpperCase();
    const color = colorInput.value;

    if (!name) {
        nameInput.focus();
        return;
    }
    if (!initials) {
        initialsInput.focus();
        return;
    }

    await ChoreRepository.addPerson(name, initials, color);
    nameInput.value = '';
    initialsInput.value = '';

    // Rotate to a new default color
    const colors = ['#6c5ce7', '#0984e3', '#00b894', '#fdcb6e', '#e17055', '#d63031', '#a29bfe'];
    const people = await ChoreRepository.getAllPeople();
    colorInput.value = colors[people.length % colors.length];

    renderPeopleList();
    await renderPalette();
    await renderBoard();
}

// ── Event Binding ───────────────────────────────────────────

// ── Rotation Modal ──────────────────────────────────────────

async function openRotationModal(choreId) {
    const overlay = document.getElementById('rotation-modal-overlay');
    document.getElementById('rotation-chore-id').value = choreId;

    // Populate group dropdown
    const groupSelect = document.getElementById('rotation-group-select');
    groupSelect.innerHTML = '';
    const groups = await ChoreRepository.getAllGroups();
    if (!groups.length) {
        alert('No groups defined. Create a group in the Members menu first.');
        return;
    }
    for (const g of groups) {
        const opt = document.createElement('option');
        opt.value = g.id;
        opt.textContent = g.name;
        groupSelect.appendChild(opt);
    }

    // Populate day dropdown
    const daySelect = document.getElementById('rotation-day-select');
    daySelect.innerHTML = '';
    const orderedDays = await getOrderedDays();
    for (const day of orderedDays) {
        const opt = document.createElement('option');
        opt.value = ALL_DAYS.indexOf(day);
        opt.textContent = day;
        daySelect.appendChild(opt);
    }

    // Populate member dropdown based on selected group
    populateRotationMembers();
    groupSelect.addEventListener('change', populateRotationMembers);

    overlay.classList.remove('hidden');
}

async function populateRotationMembers() {
    const groupId = parseInt(document.getElementById('rotation-group-select').value, 10);
    const memberSelect = document.getElementById('rotation-member-select');
    memberSelect.innerHTML = '';
    const members = await ChoreRepository.getGroupMembers(groupId);
    if (!members.length) {
        const opt = document.createElement('option');
        opt.textContent = '(no members)';
        opt.disabled = true;
        memberSelect.appendChild(opt);
        return;
    }
    members.forEach((m) => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.name;
        memberSelect.appendChild(opt);
    });
}

async function closeRotationModal() {
    document.getElementById('rotation-modal-overlay').classList.add('hidden');
}

async function applyRotation() {
    const choreId = parseInt(document.getElementById('rotation-chore-id').value, 10);
    const groupId = parseInt(document.getElementById('rotation-group-select').value, 10);
    const startMemberId = parseInt(document.getElementById('rotation-member-select').value, 10);
    const startDayIndex = parseInt(document.getElementById('rotation-day-select').value, 10);

    await ChoreRepository.assignGroupRotation(choreId, groupId, startMemberId, startDayIndex);
    closeRotationModal();
    await renderBoard();
}

// ── Event Binding ───────────────────────────────────────────

function bindEvents() {
    document.getElementById('reset-board-btn').addEventListener('click', async () => {
        if (confirm('Clear all assignments for the week?')) {
            await ChoreRepository.clearAllAssignments();
            closeSettings();
            await renderBoard();
        }
    });

    // Settings
    document.getElementById('settings-btn').addEventListener('click', openSettings);
    document.getElementById('settings-close-btn').addEventListener('click', closeSettings);
    document.getElementById('settings-save-btn').addEventListener('click', saveSettings);

    // Close modal on overlay click
    document.getElementById('settings-modal').addEventListener('click', async (e) => {
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

    membersModal.addEventListener('click', async (e) => {
        if (e.target === membersModal) closeMembers();
    });

    // Rotation Modal
    const rotationOverlay = document.getElementById('rotation-modal-overlay');
    document.getElementById('rotation-close-btn').addEventListener('click', closeRotationModal);
    document.getElementById('rotation-cancel-btn').addEventListener('click', closeRotationModal);
    document.getElementById('rotation-apply-btn').addEventListener('click', applyRotation);
    rotationOverlay.addEventListener('click', async (e) => {
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
    document.getElementById('new-person-initials').addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') addPerson();
    });
    document.getElementById('new-person-name').addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') document.getElementById('new-person-initials').focus();
    });
}

document.addEventListener('DOMContentLoaded', init);
