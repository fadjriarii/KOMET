const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const stateFilePath = path.join(__dirname, '../../logs/sync-state.json');

const defaultState = {
    status: 'idle', // 'idle' | 'running' | 'completed' | 'failed'
    currentModule: null,
    progress: {
        students: { status: 'idle', current_page: 0, total_pages: 0, total_synced: 0, skipped: 0 },
        graduates: { status: 'idle', current_page: 0, total_pages: 0, total_synced: 0, skipped: 0 },
        mbkm: { status: 'idle', current_page: 0, total_pages: 0, total_synced: 0, skipped: 0 }
    },
    startedAt: null,
    finishedAt: null,
    lastError: null
};

let currentState = { ...defaultState };

function loadState() {
    try {
        if (fs.existsSync(stateFilePath)) {
            const raw = fs.readFileSync(stateFilePath, 'utf8');
            currentState = JSON.parse(raw);
            // Self-healing: Jika server baru dinyalakan dan status tersimpan 'running',
            // artinya server pernah terhenti/di-restart -> reset agar job tracker tidak terkunci
            if (currentState.status === 'running') {
                currentState.status = 'failed';
                currentState.lastError = 'Proses terhenti karena server terputus/di-restart';
                saveState();
            }
        }
    } catch (e) {
        currentState = { ...defaultState };
    }
    return currentState;
}

let saveTimer = null;

function saveState(immediate = false) {
    const doSave = () => {
        const data = JSON.stringify(currentState, null, 2);
        fs.writeFile(stateFilePath, data, 'utf8', (err) => {
            if (err) logger.error('Gagal menyimpan status sync state:', err.message);
        });
    };

    if (immediate) {
        if (saveTimer) {
            clearTimeout(saveTimer);
            saveTimer = null;
        }
        doSave();
    } else {
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(doSave, 100);
    }
}

// Load state on startup
loadState();

const syncJobTracker = {
    getState: () => {
        return currentState;
    },
    startJob: (moduleName = 'all') => {
        currentState.status = 'running';
        currentState.currentModule = moduleName;
        currentState.startedAt = new Date().toISOString();
        currentState.finishedAt = null;
        currentState.lastError = null;
        if (moduleName === 'all') {
            currentState.progress = {
                students: { status: 'pending', current_page: 0, total_pages: 0, total_synced: 0, skipped: 0 },
                graduates: { status: 'pending', current_page: 0, total_pages: 0, total_synced: 0, skipped: 0 },
                mbkm: { status: 'pending', current_page: 0, total_pages: 0, total_synced: 0, skipped: 0 }
            };
        } else if (currentState.progress[moduleName]) {
            currentState.progress[moduleName].status = 'pending';
        }
        saveState(true);
    },
    updateProgress: (moduleName, { page, totalPages, synced, skipped, status }) => {
        if (!currentState.progress[moduleName]) {
            currentState.progress[moduleName] = {};
        }
        if (page !== undefined) currentState.progress[moduleName].current_page = page;
        if (totalPages !== undefined) currentState.progress[moduleName].total_pages = totalPages;
        if (synced !== undefined) currentState.progress[moduleName].total_synced = synced;
        if (skipped !== undefined) currentState.progress[moduleName].skipped = skipped;
        if (status !== undefined) currentState.progress[moduleName].status = status;
        saveState();
    },
    finishJob: (success = true, error = null) => {
        currentState.status = success ? 'completed' : 'failed';
        currentState.finishedAt = new Date().toISOString();
        currentState.lastError = error;
        saveState(true);
    },
    isRunning: () => {
        return currentState.status === 'running';
    }
};

module.exports = syncJobTracker;
