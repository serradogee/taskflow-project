/**
 * client.js - Cliente de red para consumir la API de TaskFlow.
 * Versión de alta compatibilidad (global, sin export).
 */

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || !window.location.hostname;
const BASE_PATH = '/post/api/v1/tasks';
const API_BASE_URL = isLocal 
    ? `http://localhost:3000${BASE_PATH}` 
    : `https://taskflow-project-backend.vercel.app${BASE_PATH}`;

async function fetchTasks() {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) throw new Error(`Error ${response.status}: No se pudieron obtener las tareas.`);
    return await response.json();
}

async function createTask(task) {
    const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
    });
    if (!response.ok) throw new Error(`Error ${response.status}: Error al crear la tarea.`);
    return await response.json();
}

async function deleteTask(id) {
    const response = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
    if (!response.ok && response.status !== 204) throw new Error(`Error ${response.status}: No se pudo eliminar la tarea.`);
    return true;
}

async function updateTask(id, data) {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`Error ${response.status}: No se pudo actualizar la tarea.`);
    return await response.json();
}
