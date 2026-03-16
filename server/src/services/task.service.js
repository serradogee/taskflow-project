// src/services/task.service.js

// Persistencia simulada en memoria
let tasks = [];

// Obtener todas las tareas
function obtenerTodas() {
    return tasks;
}

// Crear una tarea
function crearTarea(data) {
    if (!data.titulo || typeof data.titulo !== 'string' || data.titulo.trim().length < 3) {
        throw new Error('INVALID_DATA'); // Validación defensiva en la capa de servicio
    }

    const nuevaTarea = {
        id: tasks.length + 1, // id simple incremental
        titulo: data.titulo,
        prioridad: data.prioridad || 1
    };

    tasks.push(nuevaTarea);
    return nuevaTarea;
}

// Eliminar tarea por ID
function eliminarTarea(id) {
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) {
        throw new Error('NOT_FOUND'); // Lanzar error estándar si no existe
    }
    tasks.splice(index, 1);
}

module.exports = {
    obtenerTodas,
    crearTarea,
    eliminarTarea
};