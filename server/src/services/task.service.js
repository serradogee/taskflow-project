// src/services/task.service.js

let tasks = [];
let idActual = 1;

function obtenerTodas() {
    return tasks;
}

function crearTarea(data) {
    // Validación de que exista al menos título
    if (!data.title || typeof data.title !== 'string') {
        throw new Error('INVALID_DATA');
    }

    const nueva = {
        id: idActual++,
        ...data
    };

    tasks.push(nueva);
    return nueva;
}

function eliminarTarea(id) {
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) {
        throw new Error('NOT_FOUND');
    }
    tasks.splice(index, 1);
}

function actualizarTarea(id, data) {
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) {
        throw new Error('NOT_FOUND');
    }
    
    // Solo actualizamos los campos que nos manden por el PUT/PATCH
    tasks[index] = { ...tasks[index], ...data, id: id };
    
    return tasks[index];
}

module.exports = {
    obtenerTodas,
    crearTarea,
    actualizarTarea,
    eliminarTarea
};