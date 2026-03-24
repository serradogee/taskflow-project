/**
 * client.js - Cliente de red para consumir la API de TaskFlow.
 * Soporta detección automática de entorno (Local/Vercel).
 */

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const BASE_PATH = '/post/api/v1/tasks';

// URL base detectada automáticamente
const API_BASE_URL = isLocal 
    ? `http://localhost:3000${BASE_PATH}` 
    : `https://taskflow-project-backend.vercel.app${BASE_PATH}`;

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
 */
export async function deleteTask(id) {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok && response.status !== 204) {
        throw new Error(`Error ${response.status}: No se pudo eliminar la tarea.`);
    }
    return true;
}

/**
 * Actualiza una tarea por ID (PUT).
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
