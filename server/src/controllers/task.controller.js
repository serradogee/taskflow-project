// src/controllers/task.controller.js
const taskService = require('../services/task.service');

// GET /api/v1/tasks
function getTasks(req, res) {
    const tasks = taskService.obtenerTodas();
    res.json(tasks);
}

// POST /api/v1/tasks
function createTask(req, res) {
    try {
        const nueva = taskService.crearTarea(req.body);
        res.status(201).json(nueva);
    } catch (err) {
        if (err.message === 'INVALID_DATA') {
            res.status(400).json({ error: 'Datos de tarea inválidos' });
        } else {
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
}

// DELETE /api/v1/tasks/:id
function deleteTask(req, res) {
    const id = Number(req.params.id);
    try {
        taskService.eliminarTarea(id);
        res.status(204).send();
    } catch (err) {
        if (err.message === 'NOT_FOUND') {
            res.status(404).json({ error: 'Tarea no encontrada' });
        } else {
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
}

module.exports = {
    getTasks,
    createTask,
    deleteTask
};