/**
 * app.js - Lógica PREMIUM de TaskFlow.
 * Versión de alta compatibilidad (usa funciones globales de client.js).
 */

// --- ESTADOS GLOBALES ---
let tasks = [];
let currentDate = new Date();
let editingTaskId = null;
let expandedGroups = new Set();
let isGroupedByDate = true;
let expenses = [];
let editingExpenseId = null;
let currentExpenseDate = new Date();
let userCategories = JSON.parse(localStorage.getItem('taskflow_categories')) || ['Gasolina', 'Comida', 'Ocio', 'Hogar'];
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
    ['homeView', 'tasksView', 'calendarView', 'expensesView'].forEach(id => {
        document.getElementById(id)?.classList.toggle('hidden', id !== viewId);
    });
    
    // Ocultar botón flotante principal en la vista de gastos
    const fab = document.getElementById('fabAddTask');
    if (fab) {
        if (viewId === 'expensesView') fab.classList.add('hidden');
        else fab.classList.remove('hidden');
    }

    if (viewId === 'calendarView') renderCalendar();
    if (viewId === 'tasksView') renderTasks();
    if (viewId === 'expensesView') renderExpensesChart();
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
        try { expenses = await fetchExpenses(); } catch(e) { console.error("Error gastos:", e); expenses = []; }
        actualizarResumen();
        renderTasks();
        renderCalendar();
        if(document.getElementById('expensesView') && !document.getElementById('expensesView').classList.contains('hidden')) {
            renderExpensesChart();
        }
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
window.toggleDateGroup = (date) => {
    if (expandedGroups.has(date)) {
        expandedGroups.delete(date);
    } else {
        expandedGroups.add(date);
    }
    renderTasks();
};

window.toggleViewMode = () => {
    isGroupedByDate = !isGroupedByDate;
    const icon = document.getElementById('viewToggleIcon');
    const text = document.getElementById('viewToggleText');
    if (icon && text) {
        icon.textContent = isGroupedByDate ? '📑' : '📁';
        text.textContent = isGroupedByDate ? 'Vista lista' : 'Vista por fecha';
    }
    renderTasks();
};

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
    
    if (isGroupedByDate) {
        tareasContainer.className = 'flex flex-col gap-6 w-full';
        
        // Agrupar por fecha
        const groups = filtered.reduce((acc, task) => {
            const date = task.date || 'Sin fecha';
            if (!acc[date]) acc[date] = [];
            acc[date].push(task);
            return acc;
        }, {});

        // Ordenar fechas (más cercanas primero)
        const sortedDates = Object.keys(groups).sort((a, b) => {
            if (a === 'Sin fecha') return 1;
            if (b === 'Sin fecha') return -1;
            return new Date(a) - new Date(b);
        });

        sortedDates.forEach(date => {
            const dateTasks = groups[date];
            const isCollapsed = !expandedGroups.has(date);
            
            // Formatear fecha para el encabezado
            let displayDate = date;
            if (date !== 'Sin fecha') {
                const [y, m, d] = date.split('-');
                displayDate = `${d} de ${monthNames[parseInt(m) - 1]} ${y}`;
            }

            const groupDiv = document.createElement('div');
            groupDiv.className = `date-group ${isCollapsed ? 'collapsed' : ''}`;
            
            groupDiv.innerHTML = `
                <div class="date-header" onclick="window.toggleDateGroup('${date}')">
                    <div class="flex items-center gap-3">
                        <span class="accordion-icon">
                            <svg class="w-4 h-4 3xl:w-8 3xl:h-8 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </span>
                        <h3 class="3xl:text-3xl 4xl:text-5xl font-bold">${displayDate}</h3>
                    </div>
                    <span class="count 3xl:text-xl 4xl:text-3xl">${dateTasks.length} ${dateTasks.length === 1 ? 'tarea' : 'tareas'}</span>
                </div>
                <div class="date-tasks"></div>
            `;

            const tasksList = groupDiv.querySelector('.date-tasks');
            dateTasks.forEach(t => {
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
                tasksList.appendChild(card);
            });

            tareasContainer.appendChild(groupDiv);
        });
    } else {
        // Vista plana (todas juntas)
        tareasContainer.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 3xl:grid-cols-4 4xl:grid-cols-5 gap-6 3xl:gap-10 4xl:gap-16';
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
    }

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

    // --- ENCABEZADOS DE DÍAS ---
    const daysOfWeek = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    daysOfWeek.forEach(day => {
        const header = document.createElement('div');
        header.className = "text-center font-bold text-[10px] 3xl:text-xl 4xl:text-3xl py-2 text-gray-500 uppercase tracking-wider";
        header.textContent = day;
        calendar.appendChild(header);
    });

    // --- DÍAS DEL MES ---
    // getDay(): 0 (Dom), 1 (Lun)... 6 (Sáb)
    // Queremos que Lun sea 0, así que: (day + 6) % 7
    const firstDay = new Date(y, m, 1).getDay();
    const spaces = firstDay === 0 ? 6 : firstDay - 1;
    const days = new Date(y, m + 1, 0).getDate();

    // Espacios vacíos
    for (let i = 0; i < spaces; i++) calendar.appendChild(document.createElement('div'));

    // Celdas de días
    for (let d = 1; d <= days; d++) {
        const isToday = d === today.getDate() && m === today.getMonth() && y === today.getFullYear();
        const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayTasks = tasks.filter(t => t.date === dateStr);

        const dayEl = document.createElement('div');
        dayEl.className = `bg-white dark:bg-gray-800 p-2 min-h-[80px] 3xl:min-h-[150px] 4xl:min-h-[250px] rounded-xl border cursor-pointer hover:shadow-md transition-all ${isToday ? 'ring-2 ring-primary border-primary' : 'border-gray-100 dark:border-gray-700'}`;
        
        dayEl.innerHTML = `<span class="text-sm 3xl:text-3xl 4xl:text-5xl font-bold ${isToday ? 'text-primary' : 'text-gray-400'}">${d}</span>`;

        if (dayTasks.length > 0) {
            const taskList = document.createElement('div');
            taskList.className = "flex flex-col gap-1 mt-1 overflow-hidden";
            dayTasks.slice(0, 3).forEach(dt => {
                const c = dt.priority === 'Alta' ? 'bg-red-500' : (dt.priority === 'Media' ? 'bg-yellow-500' : 'bg-green-500');
                taskList.innerHTML += `
                    <div class="flex items-center gap-1.5">
                        <div class="w-2 h-2 3xl:w-3 3xl:h-3 rounded-full ${c} shrink-0"></div>
                        <span class="text-xs font-semibold 3xl:text-xl 4xl:text-3xl truncate dark:text-gray-300 text-gray-800">${dt.title}</span>
                    </div>
                `;
            });
            if (dayTasks.length > 3) {
                taskList.innerHTML += `<span class="text-[10px] font-bold 3xl:text-lg 4xl:text-2xl text-gray-500 mt-1">+ ${dayTasks.length - 3} más</span>`;
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

window.handleGlobalFabClick = () => {
    const isExpensesVisible = !document.getElementById('expensesView').classList.contains('hidden');
    if (isExpensesVisible) {
        window.openNewExpenseModal();
    } else {
        window.openNewTaskModal();
    }
};

window.changeExpenseMonth = (d) => { 
    currentExpenseDate.setMonth(currentExpenseDate.getMonth() + d); 
    renderExpensesChart(); 
};

window.renderExpensesChart = () => {
    const chartContainer = document.getElementById('expensesChartContainer');
    const monthYear = document.getElementById('expenseMonthYear');
    const totalAmountEl = document.getElementById('expenseTotalAmount');
    if (!chartContainer || !monthYear) return;

    const y = currentExpenseDate.getFullYear();
    const m = currentExpenseDate.getMonth();
    monthYear.textContent = `${monthNames[m]} ${y}`;

    const monthExpenses = expenses.filter(e => {
        if (!e.date) return false;
        const [ey, em] = e.date.split('-');
        return Number(ey) === y && Number(em) === (m + 1);
    });

    const totalsByCategory = {};
    userCategories.forEach(c => totalsByCategory[c] = 0);
    let totalMonth = 0;

    monthExpenses.forEach(e => {
        const cat = e.category || 'Otros';
        if (!totalsByCategory[cat]) totalsByCategory[cat] = 0;
        totalsByCategory[cat] += Number(e.amount);
        totalMonth += Number(e.amount);
    });

    totalAmountEl.textContent = `${totalMonth.toFixed(2)} €`;
    const maxAmount = Math.max(...Object.values(totalsByCategory), 10); 
    
    chartContainer.innerHTML = '';

    Object.entries(totalsByCategory).forEach(([category, amount]) => {
        if (amount === 0 && !userCategories.includes(category)) return;

        const heightPercent = Math.max((amount / maxAmount) * 100, 5);
        const isZero = amount === 0;

        const barGroup = document.createElement('div');
        barGroup.className = 'flex flex-col items-center justify-end h-full min-w-[60px] 3xl:min-w-[100px] cursor-pointer group flex-shrink-0 hover:scale-105 transition-transform';
        barGroup.onclick = () => {
            const m = currentExpenseDate.getMonth() + 1;
            const y = currentExpenseDate.getFullYear();
            const catExps = expenses.filter(ex => ex.category === category && Number(ex.date.split('-')[0]) === y && Number(ex.date.split('-')[1]) === m);
            window.openCategoryExpensesModal(category, catExps);
        };

        barGroup.innerHTML = `
            <span class="text-xs 3xl:text-xl font-bold text-gray-800 dark:text-gray-100 mb-1 whitespace-nowrap">${amount.toFixed(2)}€</span>
            <div class="w-10 3xl:w-16 rounded-t-md transition-all duration-500 shadow-md ${isZero ? 'bg-gray-200 dark:bg-gray-700 h-[5%]' : 'bg-primary'}" 
                 style="height: ${heightPercent}%;"></div>
            <span class="text-[10px] 3xl:text-lg text-gray-500 font-semibold mt-2 truncate w-full max-w-[60px] 3xl:max-w-[100px] text-center" title="${category}">${category}</span>
        `;
        chartContainer.appendChild(barGroup);
    });
};

window.openNewExpenseModal = (expenseToEdit = null) => {
    const modal = document.getElementById('newExpenseModal');
    
    const select = document.getElementById('expenseCategory');
    select.innerHTML = userCategories.map(c => `<option value="${c}">${c}</option>`).join('');
    if(!userCategories.includes('Otros')) select.innerHTML += `<option value="Otros">Otros</option>`;

    const d = new Date();
    let selYear = currentExpenseDate.getFullYear();
    let selMonth = String(currentExpenseDate.getMonth() + 1).padStart(2, '0');
    let selDay = String(d.getDate()).padStart(2, '0');

    if (expenseToEdit && expenseToEdit.id) {
        editingExpenseId = expenseToEdit.id;
        document.getElementById('expenseAmount').value = expenseToEdit.amount;
        select.value = expenseToEdit.category || userCategories[0];
        if (expenseToEdit.date) {
            const [y, m, day] = expenseToEdit.date.split('-');
            selYear = y; selMonth = m; selDay = day;
        }
    } else {
        editingExpenseId = null;
        document.getElementById('form-expense').reset();
    }

    const eDay = document.getElementById('expenseDay');
    const eMon = document.getElementById('expenseMonth');
    const eYer = document.getElementById('expenseYear');
    if (eDay) eDay.value = selDay;
    if (eMon) eMon.value = selMonth;
    if (eYer) eYer.value = selYear;

    modal?.classList.remove('hidden');
    modal?.classList.add('flex');
};

window.closeNewExpenseModal = () => { document.getElementById('newExpenseModal')?.classList.replace('flex', 'hidden'); };

window.editarGasto = (id) => {
    const gasto = expenses.find(e => e.id == id);
    if (gasto) window.openNewExpenseModal(gasto);
};

window.addExpense = async (e) => {
    if(e && e.preventDefault) e.preventDefault();
    
    const amount = document.getElementById('expenseAmount').value;
    const category = document.getElementById('expenseCategory').value;
    const dateStr = `${document.getElementById('expenseYear').value}-${document.getElementById('expenseMonth').value}-${document.getElementById('expenseDay').value}`;

    setUIState(true);
    try {
        if (editingExpenseId) {
            const gasto = expenses.find(ex => ex.id == editingExpenseId);
            if (gasto) {
                await updateExpense(editingExpenseId, { ...gasto, amount, category, date: dateStr });
            }
            editingExpenseId = null;
        } else {
            await createExpense({ amount, category, date: dateStr });
        }

        document.getElementById('form-expense').reset();
        window.closeNewExpenseModal();
        await cargarDatos();

        // Refrescar el modal de detalles de categoría si está abierto
        const catModal = document.getElementById('categoryExpensesModal');
        if (!catModal.classList.contains('hidden')) {
            const m = currentExpenseDate.getMonth() + 1;
            const y = currentExpenseDate.getFullYear();
            const catExpenses = expenses.filter(ex => ex.category === category && Number(ex.date.split('-')[0]) === y && Number(ex.date.split('-')[1]) === m);
            window.openCategoryExpensesModal(category, catExpenses);
        }
    } catch (err) { showError(err.message); }
    finally { setUIState(false); }
    return false;
};

window.openCategoryExpensesModal = (category, catExpenses) => {
    const modal = document.getElementById('categoryExpensesModal');
    document.getElementById('categoryModalTitle').textContent = `Gastos: ${category}`;
    
    const list = document.getElementById('categoryExpensesList');
    list.innerHTML = catExpenses.length ? '' : '<p class="text-xs text-gray-500 text-center py-2">Sin gastos en este mes.</p>';
    
    catExpenses.forEach(e => {
        list.innerHTML += `
            <div class="p-2 border rounded-lg flex justify-between items-center text-sm 3xl:text-2xl bg-gray-50 dark:bg-gray-700">
                <span><strong class="text-primary">${Number(e.amount).toFixed(2)}€</strong> el ${e.date.split('-').reverse().join('/')}</span>
                <div class="flex gap-3">
                    <button onclick="window.editarGasto(${e.id})" class="text-blue-500 hover:scale-110" title="Editar gasto">✏️</button>
                    <button onclick="window.eliminarGasto(${e.id}, '${category}')" class="text-red-500 hover:scale-110" title="Eliminar gasto">🗑</button>
                </div>
            </div>
        `;
    });

    document.getElementById('quickExpenseAmount').dataset.category = category;
    document.getElementById('quickExpenseAmount').value = '';

    modal.classList.replace('hidden', 'flex');
};

window.closeCategoryExpensesModal = () => { document.getElementById('categoryExpensesModal').classList.replace('flex', 'hidden'); };

window.submitQuickExpense = async () => {
    const input = document.getElementById('quickExpenseAmount');
    const amount = input.value;
    const category = input.dataset.category;
    if (!amount || amount <= 0) return;

    const today = new Date();
    let d = String(today.getDate()).padStart(2, '0');
    if (today.getMonth() !== currentExpenseDate.getMonth() || today.getFullYear() !== currentExpenseDate.getFullYear()) {
        d = '01';
    }
    const m = String(currentExpenseDate.getMonth() + 1).padStart(2, '0');
    const y = currentExpenseDate.getFullYear();

    setUIState(true);
    try {
        await createExpense({ amount, category, date: `${y}-${m}-${d}` });
        await cargarDatos();
        
        const catExpenses = expenses.filter(e => e.category === category && Number(e.date.split('-')[0]) === y && Number(e.date.split('-')[1]) === Number(m));
        window.openCategoryExpensesModal(category, catExpenses);
    } catch (err) { showError(err.message); }
    finally { setUIState(false); }
};

window.eliminarGasto = async (id, category) => {
    if (!confirm('¿Eliminar gasto?')) return;
    setUIState(true);
    try {
        await deleteExpense(id);
        await cargarDatos();
        
        const m = currentExpenseDate.getMonth() + 1;
        const y = currentExpenseDate.getFullYear();
        const catExpenses = expenses.filter(e => e.category === category && Number(e.date.split('-')[0]) === y && Number(e.date.split('-')[1]) === m);
        
        window.openCategoryExpensesModal(category, catExpenses);
    } catch (err) { showError(err.message); }
    finally { setUIState(false); }
};

window.openCategoriesManager = () => {
    const modal = document.getElementById('categoryManagerModal');
    renderCategoriesList();
    modal.classList.replace('hidden', 'flex');
};

window.closeCategoryManagerModal = () => { document.getElementById('categoryManagerModal').classList.replace('flex', 'hidden'); };

window.renderCategoriesList = () => {
    const list = document.getElementById('categoriesList');
    list.innerHTML = '';
    userCategories.forEach(c => {
        list.innerHTML += `
            <div class="p-2 border rounded-lg flex justify-between items-center bg-gray-50 dark:bg-gray-700 text-sm 3xl:text-2xl">
                <span>${c}</span>
                <button onclick="window.removeCategory('${c}')" class="text-red-500 hover:text-red-700 font-bold" title="Eliminar categoría">🗑</button>
            </div>
        `;
    });
};

window.addCategory = () => {
    const input = document.getElementById('newCategoryName');
    const val = input.value.trim();
    if (!val) return;
    // Primera letra en mayuscula para consistencia
    const normVal = val.charAt(0).toUpperCase() + val.slice(1);
    if (!userCategories.includes(normVal)) {
        userCategories.push(normVal);
        localStorage.setItem('taskflow_categories', JSON.stringify(userCategories));
        input.value = '';
        renderCategoriesList();
        renderExpensesChart();
    }
};

window.removeCategory = async (cat) => {
    if(!confirm(`¿Borrar categoría "${cat}" y TODOS sus gastos asociados? Esta acción no se puede deshacer.`)) return;
    
    setUIState(true);
    try {
        const gastosDeCatergoria = expenses.filter(e => e.category === cat);
        await Promise.all(gastosDeCatergoria.map(e => deleteExpense(e.id)));
        
        userCategories = userCategories.filter(c => c !== cat);
        localStorage.setItem('taskflow_categories', JSON.stringify(userCategories));
        
        await cargarDatos();
        renderCategoriesList();
        renderExpensesChart();
    } catch (err) { showError(err.message); }
    finally { setUIState(false); }
};


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
            if(window.closeNewExpenseModal) window.closeNewExpenseModal();
            if(window.closeCategoryExpensesModal) window.closeCategoryExpensesModal();
            if(window.closeCategoryManagerModal) window.closeCategoryManagerModal();
        }
    };
}

function poblarSelects() {
    const dS = [document.getElementById('taskDay'), document.getElementById('editTaskDay'), document.getElementById('expenseDay')];
    const yS = [document.getElementById('taskYear'), document.getElementById('editTaskYear'), document.getElementById('expenseYear')];
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