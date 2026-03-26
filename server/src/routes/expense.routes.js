// src/routes/expense.routes.js
const { Router } = require('express');
const { 
    getExpenses, 
    createExpense, 
    updateExpense, 
    deleteExpense 
} = require('../controllers/expense.controller');

const router = Router();

router.get('/', getExpenses);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
