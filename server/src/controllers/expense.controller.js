// src/controllers/expense.controller.js
const expenseService = require('../services/expense.service');

// GET /api/v1/expenses
function getExpenses(req, res, next) {
    try {
        const expenses = expenseService.obtenerTodos();
        res.json(expenses);
    } catch (err) {
        next(err);
    }
}

// POST /api/v1/expenses
function createExpense(req, res, next) {
    try {
        const nuevo = expenseService.crearGasto(req.body);
        res.status(201).json(nuevo);
    } catch (err) {
        next(err);
    }
}

// DELETE /api/v1/expenses/:id
function deleteExpense(req, res, next) {
    try {
        const id = Number(req.params.id);
        expenseService.eliminarGasto(id);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}

// PUT /api/v1/expenses/:id
function updateExpense(req, res, next) {
    try {
        const id = Number(req.params.id);
        const gastoActualizado = expenseService.actualizarGasto(id, req.body);
        res.json(gastoActualizado);
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getExpenses,
    createExpense,
    updateExpense,
    deleteExpense
};
