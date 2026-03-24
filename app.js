/**
 * app.js - Lógica PREMIUM de TaskFlow.
 * Versión de alta compatibilidad (usa funciones globales de client.js).
 */

// --- ESTADOS GLOBALES ---
let tasks = [];
let currentDate = new Date();
let editingTaskId = null;
const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// --- SELECTORES ---
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const tareasContainer = document.getElementById('tareas');
const formTarea = document.getElementById('form-tarea');

// ==========================================
// MODO OSCURO
// ==========================================
function initDarkMode() {
    const btn = document.getElementById('darkToggle');
    if (!btn) return;
    const isDark = localStorage.getItem('taskflow_darkMode') === 'true';
    if (isDark) {
        document.documentElement.classList.add('dark');
        btn.querySelector('span').textContent = '☀️';
    }
    btn.onclick = () => {
        const dark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('taskflow_darkMode', dark);
        btn.querySelector('span').textContent = dark ? '☀️' : '🌙';
    };
}

// ==========================================
// ACCIONES GLOBALES (MARK ALL / DELETE COMPLETED)
// ==========================================
window.markAllCompleted = async () => {
    const pending = tasks.filter(t => !t.completed);
    if (pending.length === 0) return;
    setUIState(true);
    try {
        await Promise.all(pending.map(t => updateTask(t.id, { ...t, completed: true })));
        await cargarDatos();
        lanzarConfeti();
    } catch (err) { showError(err.message); }
    finally { setUIState(false); }
};

window.deleteAllCompleted = async () => {
    const done = tasks.filter(t => t.completed);
    if (done.length === 0) return;
    if (!confirm(`¿Borrar ${done.length} tareas completadas?`)) return;
    setUIState(true);
    try {
        await Promise.all(done.map(t => deleteTask(t.id)));
        await cargarDatos();
    } catch (err) { showError(err.message); }
    finally { setUIState(false); }
};

// ==========================================
// GESTIÓN DE VISTAS
// ==========================================
window.showView = (viewId) => {
    ['homeView', 'tasksView', 'calendarView'].forEach(id => {
        document.getElementById(id)?.classList.toggle('hidden', id !== viewId);
    });
    if (viewId === 'calendarView') renderCalendar();
    if (viewId === 'tasksView') renderTasks();
    actualizarResumen();
};

window.filterFromSummary = (status) => {
    const selector = document.getElementById('filterStatus');
    if (selector) selector.value = status;
    window.showView('tasksView');
};

// ==========================================
// UI HELPERS
// ==========================================
function setUIState(isLoading) { loadingEl?.classList.toggle('hidden', !isLoading); }
function showError(msg) {
    if (errorEl) {
        document.getElementById('errorMessage').textContent = msg;
        errorEl.classList.remove('hidden');
        setTimeout(() => errorEl.classList.add('hidden'), 5000);
    }
}

// ==========================================
// OPERACIONES API (Funciones cargadas desde client.js)
// ==========================================
async function cargarDatos() {
    setUIState(true);
    try {
        tasks = await fetchTasks();
        actualizarResumen();
        renderTasks();
        renderCalendar();
    } catch (err) { showError(err.message); }
    finally { setUIState(false); }
}

window.addTask = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const title = document.getElementById('taskTitle').value;
    const day = document.getElementById('taskDay').value;
    const month = document.getElementById('taskMonth').value;
    const year = document.getElementById('taskYear').value;
    
    const newTask = {
        title,
        date: `${year}-${month}-${day}`,
        time: document.getElementById('taskTime').value,
        category: document.getElementById('taskCategory').value,
        priority: document.getElementById('taskPriority').value,
        completed: false
    };

    setUIState(true);
    try {
        await createTask(newTask);
        formTarea.reset();
        window.closeNewTaskModal();
        await cargarDatos();
    } catch (err) { showError(err.message); }
    finally { setUIState(false); }
};

window.eliminarTarea = async (id) => {
    if (!confirm('¿Eliminar tarea?')) return;
    setUIState(true);
    try {
        await deleteTask(id);
        await cargarDatos();
    } catch (err) { showError(err.message); }
    finally { setUIState(false); }
};

window.toggleTask = async (id) => {
    const t = tasks.find(task => task.id == id);
    if (!t) return;
    setUIState(true);
    try {
        const newStatus = !t.completed;
        await updateTask(id, { ...t, completed: newStatus });
        await cargarDatos();
        if (newStatus) lanzarConfeti();
    } catch (err) { showError(err.message); }
    finally { setUIState(false); }
};

// ==========================================
// EDICIÓN DE TAREAS
// ==========================================
window.openEditModal = (id) => {
    const t = tasks.find(task => task.id == id);
    if (!t) return;
    editingTaskId = id;
    
    document.getElementById('editTaskTitle').value = t.title;
    document.getElementById('editTaskTime').value = t.time || "";
    document.getElementById('editTaskCategory').value = t.category || "";
    document.getElementById('editTaskPriority').value = t.priority || "Media";
    
    if (t.date) {
        const [y, m, d] = t.date.split('-');
        document.getElementById('editTaskDay').value = d;
        document.getElementById('editTaskMonth').value = m;
        document.getElementById('editTaskYear').value = y;
    }

    const modal = document.getElementById('editTaskModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
};

window.saveTaskEdits = async () => {
    if (!editingTaskId) return;
    const t = tasks.find(task => task.id == editingTaskId);
    
    const updated = {
        ...t,
        title: document.getElementById('editTaskTitle').value,
        time: document.getElementById('editTaskTime').value,
        category: document.getElementById('editTaskCategory').value,
        priority: document.getElementById('editTaskPriority').value,
        date: `${document.getElementById('editTaskYear').value}-${document.getElementById('editTaskMonth').value}-${document.getElementById('editTaskDay').value}`
    };

    setUIState(true);
    try {
        await updateTask(editingTaskId, updated);
        window.closeEditModal();
        await cargarDatos();
    } catch (err) { showError(err.message); }
    finally { setUIState(false); }
};

window.closeEditModal = () => {
    const modal = document.getElementById('editTaskModal');
    modal?.classList.add('hidden');
    modal?.classList.remove('flex');
    editingTaskId = null;
};

// ==========================================
// RENDERIZADO
// ==========================================
window.renderTasks = () => {
    if (!tareasContainer) return;
    const nF = document.getElementById('filterName')?.value.toLowerCase() || '';
    const sF = document.getElementById('filterStatus')?.value || 'all';
    const pF = document.getElementById('filterPriority')?.value || 'all';

    const filtered = tasks.filter(t => {
        return t.title.toLowerCase().includes(nF) &&
               (sF === 'all' || (sF === 'completed' ? t.completed : !t.completed)) &&
               (pF === 'all' || t.priority === pF);
    });

    tareasContainer.innerHTML = '';
    filtered.forEach(t => {
        const color = t.priority === 'Alta' ? 'red' : (t.priority === 'Media' ? 'yellow' : 'green');
        const card = document.createElement('div');
        card.className = `task-card bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border-l-4 border-${color}-500 transition-all ${t.completed ? 'opacity-50 grayscale' : ''}`;
        card.innerHTML = `
            <div class="flex items-start gap-3">
                <input type="checkbox" ${t.completed ? 'checked' : ''} onchange="window.toggleTask('${t.id}')" class="mt-1 w-5 h-5 cursor-pointer">
                <div class="flex-1">
                    <h4 class="font-bold ${t.completed ? 'line-through text-gray-400' : ''}">${t.title}</h4>
                    <p class="text-[10px] text-gray-500 uppercase font-bold">
                        ${t.category ? `${t.category} • ` : ''}${t.date || 'Sin fecha'} • ${t.time || 'Todo el día'}
                    </p>
                </div>
            </div>
            <div class="mt-4 flex justify-between items-center">
                <button onclick="window.openEditModal('${t.id}')" class="text-xs text-blue-500 font-bold hover:underline">Editar</button>
                <button onclick="window.eliminarTarea('${t.id}')" class="text-xs text-red-500 font-bold hover:underline">Eliminar</button>
            </div>
        `;
        tareasContainer.appendChild(card);
    });
    document.getElementById('taskCounter').textContent = `${filtered.length} tareas`;
};

window.renderCalendar = () => {
    const calendar = document.getElementById('calendar');
    const monthYear = document.getElementById('monthYear');
    if (!calendar || !monthYear) return;
    calendar.innerHTML = '';
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const today = new Date();
    monthYear.textContent = `${monthNames[m]} ${y}`;
    const firstDay = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();
    for (let i = 0; i < firstDay; i++) calendar.appendChild(document.createElement('div'));
    for (let d = 1; d <= days; d++) {
        const isToday = d === today.getDate() && m === today.getMonth() && y === today.getFullYear();
        const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayTasks = tasks.filter(t => t.date === dateStr);
        const dayEl = document.createElement('div');
        dayEl.className = `bg-white dark:bg-gray-800 p-2 min-h-[80px] rounded-xl border cursor-pointer hover:shadow-md transition-all ${isToday ? 'ring-2 ring-primary' : 'border-gray-100 dark:border-gray-700'}`;
        dayEl.innerHTML = `<span class="text-xs font-bold ${isToday ? 'text-primary' : 'text-gray-400'}">${d}</span>`;
        if (dayTasks.length > 0) {
            const taskList = document.createElement('div');
            taskList.className = "flex flex-col gap-0.5 mt-1 overflow-hidden";
            dayTasks.slice(0, 3).forEach(dt => {
                const c = dt.priority === 'Alta' ? 'bg-red-500' : (dt.priority === 'Media' ? 'bg-yellow-500' : 'bg-green-500');
                taskList.innerHTML += `
                    <div class="flex items-center gap-1">
                        <div class="w-1 h-1 rounded-full ${c} shrink-0"></div>
                        <span class="text-[8px] truncate dark:text-gray-300">${dt.title}</span>
                    </div>
                `;
            });
            if (dayTasks.length > 3) {
                taskList.innerHTML += `<span class="text-[7px] text-gray-400">+ ${dayTasks.length - 3} más</span>`;
            }
            dayEl.appendChild(taskList);
        }
        dayEl.onclick = () => window.openCalendarModal(d, m + 1, y, dayTasks);
        calendar.appendChild(dayEl);
    }
};

window.changeMonth = (d) => { currentDate.setMonth(currentDate.getMonth() + d); renderCalendar(); };

window.openCalendarModal = (d, m, y, dayTasks) => {
    const modal = document.getElementById('calendarModal');
    document.getElementById('modalTitle').textContent = `${d} de ${monthNames[m-1]}`;
    const container = document.getElementById('modalTasks');
    container.innerHTML = dayTasks.length ? "" : '<p class="text-center text-gray-500 py-4">Sin tareas.</p>';
    dayTasks.forEach(t => {
        container.innerHTML += `
            <div class="p-2 bg-gray-50 dark:bg-gray-700 rounded flex justify-between items-center mb-2">
                <span class="${t.completed ? 'line-through' : ''}">${t.title}</span>
                <button onclick="window.eliminarTarea('${t.id}')" class="text-red-500">🗑</button>
            </div>
        `;
    });
    document.getElementById('addCalendarTaskBtn').onclick = () => { window.closeCalendarModal(); window.openModalWithDate(d, m, y); };
    modal.classList.replace('hidden', 'flex');
};

window.openModalWithDate = (d, m, y) => {
    document.getElementById('taskDay').value = String(d).padStart(2, '0');
    document.getElementById('taskMonth').value = String(m).padStart(2, '0');
    document.getElementById('taskYear').value = y;
    window.openNewTaskModal();
};

window.closeCalendarModal = () => { document.getElementById('calendarModal')?.classList.replace('flex', 'hidden'); };
window.openNewTaskModal = () => {
    const modal = document.getElementById('newTaskModal');
    const d = new Date();
    document.getElementById('taskDay').value = String(d.getDate()).padStart(2, '0');
    document.getElementById('taskMonth').value = String(d.getMonth() + 1).padStart(2, '0');
    document.getElementById('taskYear').value = d.getFullYear();
    modal?.classList.replace('hidden', 'flex');
};
window.closeNewTaskModal = () => { document.getElementById('newTaskModal')?.classList.replace('flex', 'hidden'); };

function actualizarResumen() {
    const total = tasks.length;
    const done = tasks.filter(t => t.completed).length;
    document.getElementById('summaryTotal').textContent = total;
    document.getElementById('summaryCompleted').textContent = done;
    document.getElementById('summaryPending').textContent = total - done;
    const bar = document.getElementById('summaryProgressBar');
    if (bar) bar.style.width = `${total > 0 ? (done / total) * 100 : 0}%`;
}

function initKeyListeners() {
    window.onkeyup = (e) => {
        if (e.key === "Escape") {
            window.closeCalendarModal();
            window.closeNewTaskModal();
            window.closeEditModal();
        }
    };
}

function poblarSelects() {
    const dS = [document.getElementById('taskDay'), document.getElementById('editTaskDay')];
    const yS = [document.getElementById('taskYear'), document.getElementById('editTaskYear')];
    dS.forEach(s => { if (s) { s.innerHTML = ""; for (let i = 1; i <= 31; i++) s.innerHTML += `<option value="${String(i).padStart(2, '0')}">${i}</option>`; } });
    yS.forEach(s => { if (s) { s.innerHTML = ""; for (let i = 2024; i <= 2026; i++) s.innerHTML += `<option value="${i}">${i}</option>`; } });
}

document.addEventListener('DOMContentLoaded', () => {
    poblarSelects();
    initDarkMode();
    initKeyListeners();
    cargarDatos();
    if (formTarea) formTarea.onsubmit = window.addTask;
});

function lanzarConfeti() {
    for (let i = 0; i < 50; i++) {
        const c = document.createElement('div');
        c.className = 'confetti';
        c.style.left = Math.random() * 100 + 'vw';
        c.style.backgroundColor = ['#e10600', '#111', '#ccc'][Math.floor(Math.random() * 3)];
        c.style.animationDuration = (Math.random() * 3 + 2) + 's';
        document.body.appendChild(c);
        setTimeout(() => c.remove(), 5000);
    }
}