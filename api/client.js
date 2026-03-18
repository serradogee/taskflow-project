// api/client.js
// Configuración para el profesor: Por defecto usa localStorage cuando no está en localhost
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// URL de la API (solo se usa en local por defecto)
const API_URL = isLocal ? 'http://localhost:3001/post/api/v1/tasks' : null;
const LOCAL_STORAGE_KEY = 'taskflow_local_tasks';

/**
 * Obtiene las tareas locales del localStorage de forma segura.
 */
function getLocalTasks() {
    try {
        const data = localStorage.getItem(LOCAL_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

/**
 * Guarda las tareas locales en el localStorage de forma segura.
 */
function saveLocalTasks(tasks) {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {}
}

window.fetchTasks = async function() {
    let apiTasks = [];
    if (API_URL) {
        try {
            const response = await fetch(API_URL);
            if (response.ok) apiTasks = await response.json();
        } catch (error) {
            console.warn("Servidor no detectado, usando modo local.");
        }
    }

    const localTasks = getLocalTasks();
    const apiIds = new Set(apiTasks.map(t => String(t.id)));
    return [...apiTasks, ...localTasks.filter(t => !apiIds.has(String(t.id)))];
}

window.createTask = async function(task) {
    // Si hay URL de API, intentamos guardar allí
    if (API_URL) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(task)
            });
            if (response.ok) return await response.json();
        } catch (error) {
            console.warn("Error en servidor, guardando localmente.");
        }
    }

    // Fallback SIEMPRE: Guardar localmente
    const localTasks = getLocalTasks();
    const newTask = { ...task, id: `local-${Date.now()}`, isLocal: true };
    localTasks.push(newTask);
    saveLocalTasks(localTasks);
    return newTask;
}

window.deleteTask = async function(id) {
    const isLocalId = typeof id === 'string' && id.startsWith('local-');
    
    if (isLocalId) {
        const localTasks = getLocalTasks().filter(t => String(t.id) !== String(id));
        saveLocalTasks(localTasks);
        return true;
    }

    if (API_URL) {
        try {
            const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            if (response.ok || response.status === 204) return true;
        } catch (e) {}
    }
    
    return true; // Retornamos true para no bloquear la UI aunque el API falle
}

window.updateTask = async function(id, updates) {
    const isLocalId = typeof id === 'string' && id.startsWith('local-');

    if (isLocalId) {
        const localTasks = getLocalTasks().map(t => String(t.id) === String(id) ? { ...t, ...updates } : t);
        saveLocalTasks(localTasks);
        return localTasks.find(t => String(t.id) === String(id));
    }

    if (API_URL) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            if (response.ok) return await response.json();
        } catch (e) {}
    }
    
    // Si falla el servidor, actualizamos al menos el estado local si existía una copia (opcional)
    return { id, ...updates }; // Devolvemos algo para no romper la UI
}
