// src/services/expense.service.js

let expenses = [];
let idActual = 1;

function obtenerTodos() {
    return expenses;
}

function crearGasto(data) {
    if (!data.amount || !data.category || !data.date) {
        throw new Error('INVALID_DATA');
    }

    const nuevo = {
        id: idActual++,
        ...data,
        amount: Number(data.amount)
    };

    expenses.push(nuevo);
    return nuevo;
}

function eliminarGasto(id) {
    const index = expenses.findIndex(e => e.id === id);
    if (index === -1) {
        throw new Error('NOT_FOUND');
    }
    expenses.splice(index, 1);
}

function actualizarGasto(id, data) {
    const index = expenses.findIndex(e => e.id === id);
    if (index === -1) {
        throw new Error('NOT_FOUND');
    }
    
    expenses[index] = { 
        ...expenses[index], 
        ...data, 
        id: id,
        amount: data.amount ? Number(data.amount) : expenses[index].amount
    };
    
    return expenses[index];
}

module.exports = {
    obtenerTodos,
    crearGasto,
    eliminarGasto,
    actualizarGasto
};
