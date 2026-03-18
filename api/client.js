// api/client.js
// Configuración dinámica de la URL de la API
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// En GitHub Pages, el proyecto suele estar en una subcarpeta /nombre-repo/
// Usamos una ruta que intente ser relativa al origen o fallar si no estamos en local
const API_URL = isLocal ? 'http://localhost:3001/post/api/v1/tasks' : (window.location.origin + window.location.pathname + 'post/api/v1/tasks');

const LOCAL_STORAGE_KEY = 'taskflow_local_tasks';

/**
 * Obtiene las tareas locales del localStorage de forma segura.
 */
function getLocalTasks() {
    try {
        const data = localStorage.getItem(LOCAL_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Error al leer localStorage:", e);
        return [];
    }
}

/**
 * Guarda las tareas locales en el localStorage de forma segura.
 */
function saveLocalTasks(tasks) {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
        console.error("Error al guardar en localStorage (posiblemente lleno):", e);
    }
}

window.fetchTasks = async function() {
    let apiTasks = [];
    try {
        // Solo intentamos fetch si estamos en local o si no estamos en un entorno estático puro
        const response = await fetch(API_URL);
        if (response.ok) {
            apiTasks = await response.json();
        }
    } catch (error) {
        console.warn("API no accesible (esperado en GitHub Pages si no hay backend desplegado):", error);
    }

    const localTasks = getLocalTasks();
    const apiIds = new Set(apiTasks.map(t => String(t.id)));
    const mergedTasks = [...apiTasks, ...localTasks.filter(t => !apiIds.has(String(t.id)))];
    
    return mergedTasks;
}

window.createTask = async function(task) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });
        
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error("Error en servidor, usando modo local:", error);
    }

    // Fallback: Guardar localmente
    const localTasks = getLocalTasks();
    const newTask = { ...task, id: `local-${Date.now()}`, isLocal: true };
    localTasks.push(newTask);
    saveLocalTasks(localTasks);
    return newTask;
}

window.deleteTask = async function(id) {
    // Intentar borrar en servidor si no es local
    if (typeof id === 'string' && id.startsWith('local-')) {
        const localTasks = getLocalTasks().filter(t => t.id !== id);
        saveLocalTasks(localTasks);
        return true;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (response.ok || response.status === 204) return true;
    } catch (error) {
        console.error("Error al eliminar en servidor:", error);
    }
    
    return false;
}

window.updateTask = async function(id, updates) {
    // Si es local, actualizar solo local
    if (typeof id === 'string' && id.startsWith('local-')) {
        const localTasks = getLocalTasks().map(t => t.id === id ? { ...t, ...updates } : t);
        saveLocalTasks(localTasks);
        return localTasks.find(t => t.id === id);
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        
        if (response.ok) return await response.json();
    } catch (error) {
        console.error("Error al actualizar en servidor:", error);
    }
    
    // Si falla el servidor para una tarea que estaba en el servidor, 
    // podríamos opcionalmente guardarla como local-overridden, 
    // pero por simplicidad seguiremos el flujo de error.
    throw new Error("No se pudo actualizar la tarea");
}
