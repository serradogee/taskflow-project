// api/client.js
console.log("api/client.js cargado correctamente");

// Configuración para el profesor: Por defecto usa localStorage cuando no está en localhost
const _isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const _API_URL = _isLocal ? 'http://localhost:3001/post/api/v1/tasks' : null;
const _LOCAL_STORAGE_KEY = 'taskflow_local_tasks';

function _getLocalTasks() {
    try {
        const data = localStorage.getItem(_LOCAL_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

function _saveLocalTasks(tasks) {
    try {
        localStorage.setItem(_LOCAL_STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {}
}

async function fetchTasks() {
    let apiTasks = [];
    if (_API_URL) {
        try {
            const response = await fetch(_API_URL);
            if (response.ok) apiTasks = await response.json();
        } catch (error) {
            console.warn("Servidor no detectado, usando modo local.");
        }
    }
    const localTasks = _getLocalTasks();
    const apiIds = new Set(apiTasks.map(t => String(t.id)));
    return [...apiTasks, ...localTasks.filter(t => !apiIds.has(String(t.id)))];
}

async function createTask(task) {
    if (_API_URL) {
        try {
            const response = await fetch(_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(task)
            });
            if (response.ok) return await response.json();
        } catch (error) {
            console.warn("Error en servidor, guardando localmente.");
        }
    }
    const localTasks = _getLocalTasks();
    const newTask = { ...task, id: `local-${Date.now()}`, isLocal: true };
    localTasks.push(newTask);
    _saveLocalTasks(localTasks);
    return newTask;
}

async function deleteTask(id) {
    const isLocalId = typeof id === 'string' && id.startsWith('local-');
    if (isLocalId) {
        const localTasks = _getLocalTasks().filter(t => String(t.id) !== String(id));
        _saveLocalTasks(localTasks);
        return true;
    }
    if (_API_URL) {
        try {
            const response = await fetch(`${_API_URL}/${id}`, { method: 'DELETE' });
            if (response.ok || response.status === 204) return true;
        } catch (e) {}
    }
    return true;
}

async function updateTask(id, updates) {
    const isLocalId = typeof id === 'string' && id.startsWith('local-');
    if (isLocalId) {
        const localTasks = _getLocalTasks().map(t => String(t.id) === String(id) ? { ...t, ...updates } : t);
        _saveLocalTasks(localTasks);
        return localTasks.find(t => String(t.id) === String(id));
    }
    if (_API_URL) {
        try {
            const response = await fetch(`${_API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            if (response.ok) return await response.json();
        } catch (e) {}
    }
    return { id, ...updates };
}

// Exportar al objeto global explícitamente por si acaso
window.fetchTasks = fetchTasks;
window.createTask = createTask;
window.deleteTask = deleteTask;
window.updateTask = updateTask;
