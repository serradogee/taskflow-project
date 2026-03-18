// src/controllers/task.controller.js
const taskService = require('../services/task.service');

// GET /api/v1/tasks
function getTasks(req, res, next) {
    try {
        const tasks = taskService.obtenerTodas();
        res.json(tasks);
    } catch (err) {
        next(err);
    }
}

// POST /api/v1/tasks
function createTask(req, res, next) {
    try {
        const nueva = taskService.crearTarea(req.body);
        res.status(201).json(nueva);
    } catch (err) {
        next(err);
    }
}

// DELETE /api/v1/tasks/:id
function deleteTask(req, res, next) {
    try {
        const id = Number(req.params.id);
        taskService.eliminarTarea(id);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}

// PUT /api/v1/tasks/:id
function updateTask(req, res, next) {
    try {
        const id = Number(req.params.id);
        const tareaActualizada = taskService.actualizarTarea(id, req.body);
        res.json(tareaActualizada);
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getTasks,
    createTask,
    updateTask,
    deleteTask
};