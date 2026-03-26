/**
 * client.js - Cliente de red para consumir la API de TaskFlow.
 * Versión Híbrida/Offline-First (API + LocalStorage Fallback)
 */

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || !window.location.hostname;
const BASE_PATH = '/post/api/v1/tasks';
const API_BASE_URL = isLocal 
    ? `http://localhost:3000${BASE_PATH}` 
    : `https://taskflow-project-backend.vercel.app${BASE_PATH}`;

// ===== TAREAS =====
async function fetchTasks() {
    try {
        const response = await fetch(API_BASE_URL);
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('taskflow_tasks', JSON.stringify(data));
            return data;
        }
    } catch(e) { console.warn('Backend unavailable. Usando Tareas Locales.'); }
    return JSON.parse(localStorage.getItem('taskflow_tasks') || '[]');
}

async function createTask(task) {
    let result = { id: Date.now(), ...task };
    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });
        if (response.ok) result = await response.json();
    } catch(e) { console.warn('Offline creation for task'); }
    
    let local = JSON.parse(localStorage.getItem('taskflow_tasks') || '[]');
    local.push(result);
    localStorage.setItem('taskflow_tasks', JSON.stringify(local));
    return result;
}

async function deleteTask(id) {
    try { await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' }); } catch(e) { console.warn('Offline deletion for task'); }
    
    let local = JSON.parse(localStorage.getItem('taskflow_tasks') || '[]');
    local = local.filter(t => t.id != id);
    localStorage.setItem('taskflow_tasks', JSON.stringify(local));
    return true;
}

async function updateTask(id, data) {
    let result = { ...data, id };
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (response.ok) result = await response.json();
    } catch(e) { console.warn('Offline update for task'); }
    
    let local = JSON.parse(localStorage.getItem('taskflow_tasks') || '[]');
    const index = local.findIndex(t => t.id == id);
    if(index !== -1) {
        local[index] = result;
        localStorage.setItem('taskflow_tasks', JSON.stringify(local));
    }
    return result;
}

// ===== GASTOS =====
const EXPENSES_BASE_PATH = '/post/api/v1/expenses';
const EXPENSES_API_BASE_URL = isLocal 
    ? `http://localhost:3000${EXPENSES_BASE_PATH}` 
    : `https://taskflow-project-backend.vercel.app${EXPENSES_BASE_PATH}`;

async function fetchExpenses() {
    try {
        const response = await fetch(EXPENSES_API_BASE_URL);
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('taskflow_expenses', JSON.stringify(data));
            return data;
        }
    } catch(e) { console.warn('Backend unavailable. Usando Gastos Locales.'); }
    return JSON.parse(localStorage.getItem('taskflow_expenses') || '[]');
}

async function createExpense(expense) {
    let result = { id: Date.now(), ...expense, amount: Number(expense.amount) };
    try {
        const response = await fetch(EXPENSES_API_BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result)
        });
        if (response.ok) result = await response.json();
    } catch(e) { console.warn('Offline creation for expense'); }
    
    let local = JSON.parse(localStorage.getItem('taskflow_expenses') || '[]');
    local.push(result);
    localStorage.setItem('taskflow_expenses', JSON.stringify(local));
    return result;
}

async function deleteExpense(id) {
    try { await fetch(`${EXPENSES_API_BASE_URL}/${id}`, { method: 'DELETE' }); } catch(e) { console.warn('Offline deletion for expense'); }
    
    let local = JSON.parse(localStorage.getItem('taskflow_expenses') || '[]');
    local = local.filter(t => t.id != id);
    localStorage.setItem('taskflow_expenses', JSON.stringify(local));
    return true;
}

async function updateExpense(id, data) {
    let result = { ...data, id, amount: Number(data.amount) };
    try {
        const response = await fetch(`${EXPENSES_API_BASE_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result)
        });
        if (response.ok) result = await response.json();
    } catch(e) { console.warn('Offline update for expense'); }
    
    let local = JSON.parse(localStorage.getItem('taskflow_expenses') || '[]');
    const index = local.findIndex(t => t.id == id);
    if (index !== -1) {
        local[index] = result;
        localStorage.setItem('taskflow_expenses', JSON.stringify(local));
    }
    return result;
}
