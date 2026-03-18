// src/api/client.js

const BASE_URL = 'http://localhost:3000/api/v1/tasks';

// Obtener todas las tareas
export async function fetchTasks() {
    const res = await fetch(BASE_URL);
    if (!res.ok) throw new Error('Error al obtener tareas');
    return res.json();
}

// Crear nueva tarea
export async function createTask(tarea) {
    const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tarea),
    });
    if (!res.ok) throw new Error('Error al crear tarea');
    return res.json();
}

// Eliminar tarea por ID
export async function deleteTask(id) {
    const res = await fetch(`${BASE_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Error al eliminar tarea');
    return res;
}