// api/client.js
const API_URL = 'http://localhost:3000/api/v1/tasks';

window.fetchTasks = async function() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error al obtener las tareas:", error);
        throw error;
    }
}

window.createTask = async function(task) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(task)
        });
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error al crear la tarea:", error);
        throw error;
    }
}

window.deleteTask = async function(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok && response.status !== 204) {
             throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }
        
        return true;
    } catch (error) {
        console.error("Error al eliminar la tarea:", error);
        throw error;
    }
}

window.updateTask = async function(id, updates) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
        });
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error al actualizar la tarea:", error);
        throw error;
    }
}
