/**
 * client.js - Cliente de red para consumir la API de TaskFlow.
 * Soporta detección automática de entorno (Local/Vercel).
 */

// NOTA: Según tu archivo index.js del backend, la ruta base es /post/api/v1/tasks
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const BASE_PATH = '/post/api/v1/tasks';

const API_BASE_URL = isLocal 
    ? `http://localhost:3000${BASE_PATH}` 
    : BASE_PATH;

/**
 * Obtiene todas las tareas del servidor (GET).
 */
export async function fetchTasks() {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudieron obtener las tareas.`);
    }
    return await response.json();
}

/**
 * Crea una nueva tarea en el servidor (POST).
 * @param {Object} task - { title: string }
 */
export async function createTask(task) {
    const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
    });
    if (!response.ok) {
        throw new Error(`Error ${response.status}: Error al crear la tarea.`);
    }
    return await response.json();
}

/**
 * Elimina una tarea por ID (DELETE).
 * @param {string|number} id - El ID de la tarea en el servidor.
 */
export async function deleteTask(id) {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE'
    });
    // Algunos servidores devuelven 204 No Content sin cuerpo JSON
    if (!response.ok && response.status !== 204) {
        throw new Error(`Error ${response.status}: No se pudo eliminar la tarea.`);
    }
    return true;
}

/**
 * Actualiza una tarea por ID (PUT).
 * @param {string|number} id 
 * @param {Object} data 
 */
export async function updateTask(id, data) {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudo actualizar la tarea.`);
    }
    return await response.json();
}
