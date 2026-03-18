let tasks = [];
let currentDate = new Date();
let editingTaskId = null;

// Preferencia de tema
const rootElement = document.documentElement;
const storedTheme = localStorage.getItem("theme");
if (storedTheme === "dark") {
    rootElement.classList.add("dark");
}

// Carga inicial
document.addEventListener("DOMContentLoaded", async () => {
    initDateSelects();
    try {
        const fetchedTasks = await fetchTasks();
        tasks = sortTasksByDateTime(fetchedTasks);
    } catch (e) {
        console.error("Error cargando tareas iniciales", e);
    }
    renderTasks();
    renderCalendar();
    updateTaskSummary();
});

/**
 * Ordena una lista de tareas por fecha y hora (ascendente).
 * @param {Array<Object>} taskList - Lista de tareas a ordenar.
 * @returns {Array<Object>} Lista ordenada.
 */
function sortTasksByDateTime(taskList) {
    return [...taskList].sort((taskA, taskB) => {
        const aKey = taskA.date + (taskA.time || "23:59");
        const bKey = taskB.date + (taskB.time || "23:59");
        return aKey.localeCompare(bKey);
    });
}

/**
 * Obtiene los filtros introducidos en el formulario de filtros de tareas.
 * @returns {{title: string, status: string, priority: string, date: string}} Filtros normalizados.
 */
function getTaskFilters() {
    const titleFilter = document.getElementById("filterName")?.value.toLowerCase() || "";
    const statusFilter = document.getElementById("filterStatus")?.value || "all";
    const priorityFilter = document.getElementById("filterPriority")?.value || "all";
    const dateFilter = window.currentDateFilter || ""; // Variable global temporal para el filtro rápido de fechas

    return {
        title: titleFilter,
        status: statusFilter,
        priority: priorityFilter,
        date: dateFilter
    };
}

/**
 * Aplica los filtros del listado de tareas sobre una lista dada.
 * @param {Array<Object>} taskList - Lista de tareas de entrada.
 * @param {{title: string, status: string, priority: string, date: string}} filters - Filtros a aplicar.
 * @returns {Array<Object>} Lista filtrada.
 */
function applyTaskFilters(taskList, filters) {
    return taskList
        .filter(task => task.title.toLowerCase().includes(filters.title))
        .filter(task => {
            if (filters.status === "pending") return !task.completed;
            if (filters.status === "completed") return task.completed;
            return true; // "all"
        })
        .filter(task => filters.priority === "all" || task.priority === filters.priority)
        .filter(task => !filters.date || task.date === filters.date);
}

/**
 * Obtiene la opción de ordenación seleccionada en el listado de tareas.
 * @returns {string} Clave de ordenación seleccionada.
 */
function getTaskSortOption() {
    const sortSelect = document.getElementById("sortOption");
    return sortSelect?.value || "dateAsc";
}

/**
 * Ordena una lista de tareas para su visualización según la opción seleccionada.
 * @param {Array<Object>} taskList - Lista de tareas a ordenar.
 * @param {string} sortOption - Clave de ordenación.
 * @returns {Array<Object>} Lista ordenada.
 */
function sortTasksForView(taskList, sortOption) {
    const listCopy = [...taskList];

    switch (sortOption) {
        case "dateDesc":
            return listCopy.sort((a, b) => {
                const aKey = a.date + (a.time || "23:59");
                const bKey = b.date + (b.time || "23:59");
                return bKey.localeCompare(aKey);
            });
        case "titleAsc":
            return listCopy.sort((a, b) => a.title.localeCompare(b.title, "es", { sensitivity: "base" }));
        case "priorityDesc":
            const priorityOrder = { "Alta": 3, "Media": 2, "Baja": 1 };
            return listCopy.sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0));
        case "dateAsc":
        default:
            return sortTasksByDateTime(listCopy);
    }
}

/**
 * Resetea los filtros de la lista de tareas y vuelve a mostrar todo.
 */
function resetTaskFilters() {
    const nameInput = document.getElementById("filterName");
    const statusSelect = document.getElementById("filterStatus");
    const prioritySelect = document.getElementById("filterPriority");
    const sortSelect = document.getElementById("sortOption");

    if (nameInput) nameInput.value = "";
    if (statusSelect) statusSelect.value = "all";
    if (prioritySelect) prioritySelect.value = "all";
    if (sortSelect) sortSelect.value = "dateAsc";

    window.currentDateFilter = ""; // Limpiar variable de fecha de hoy

    renderTasks();
}

/* DOMContentLoaded was moved to top level */

/**
 * Rellena las opciones de días y años en los selectores de fecha personalizados.
 */
function initDateSelects() {
    const currentYear = new Date().getFullYear();
    const daysHtml = Array.from({ length: 31 }, (_, i) => `<option value="${String(i + 1).padStart(2, '0')}">${i + 1}</option>`).join('');
    const yearsHtml = Array.from({ length: 10 }, (_, i) => `<option value="${currentYear + i}">${currentYear + i}</option>`).join('');

    ['taskDay', 'editTaskDay'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = daysHtml;
    });

    ['taskYear', 'editTaskYear'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = yearsHtml;
    });
}

/* ---------------- VISTAS ---------------- */
/**
 * Muestra la vista indicada y oculta el resto.
 * @param {string} id - Identificador de la sección a mostrar.
 */
function showView(id) {
    const views = ["homeView", "tasksView", "calendarView"];

    views.forEach(viewId => {
        const el = document.getElementById(viewId);
        if (el) {
            el.classList.add("hidden");
        }
    });

    const activeView = document.getElementById(id);
    if (activeView) {
        activeView.classList.remove("hidden");
    }

    document.querySelectorAll("nav button").forEach(btn => btn.classList.remove("active"));

    if (id === "tasksView") document.querySelectorAll("nav button")[0]?.classList.add("active");
    if (id === "calendarView") document.querySelectorAll("nav button")[1]?.classList.add("active");
}

/* ---------------- CREAR TAREA ---------------- */
/**
 * Valida los datos del formulario y crea una nueva tarea.
 */
async function addTask() {
    const titleInput = document.getElementById("taskTitle");
    const dayInput = document.getElementById("taskDay");
    const monthInput = document.getElementById("taskMonth");
    const yearInput = document.getElementById("taskYear");

    const timeInput = document.getElementById("taskTime");
    const categoryInput = document.getElementById("taskCategory");
    const prioritySelect = document.getElementById("taskPriority");

    const title = titleInput.value.trim();
    const date = `${yearInput.value}-${monthInput.value}-${dayInput.value}`;
    const time = timeInput.value;
    const category = categoryInput.value.trim() || "Sin categoría";
    const priority = prioritySelect.value;

    if (!title || !dayInput.value || !monthInput.value || !yearInput.value) {
        alert("Debes indicar al menos un título y una fecha válida.");
        return;
    }

    if (title.length < 3) {
        alert("El título debe tener al menos 3 caracteres.");
        return;
    }

    if (title.length > 100) {
        alert("El título es demasiado largo (máximo 100 caracteres).");
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);
    if (selectedDate < today) {
        alert("La fecha no puede estar en el pasado.");
        return;
    }

    const newTaskData = {
        title,
        date,
        time,
        category,
        priority,
        completed: false
    };

    try {
        const createdTask = await createTask(newTaskData);
        if (createdTask) {
            tasks = sortTasksByDateTime([...tasks, createdTask]);
            
            titleInput.value = "";
            timeInput.value = "";
            categoryInput.value = "";

            renderTasks();
            renderCalendar();
            showTaskCreatedMessage();
            closeNewTaskModal();
        }
    } catch (err) {
        console.error("Error al procesar la tarea:", err);
    }
}

/* ---------------- MENSAJE TEMPORAL ---------------- */
/**
 * Muestra un mensaje flotante indicando que la tarea se ha creado correctamente.
 */
function showTaskCreatedMessage() {
    const msg = document.createElement("div");
    msg.textContent = "✅ Tarea creada";
    msg.className = "fixed top-5 right-5 bg-green-600 text-white px-4 py-2 rounded shadow-lg font-semibold opacity-0 transition-all transform -translate-y-5";
    document.body.appendChild(msg);

    setTimeout(() => msg.classList.remove("opacity-0", "-translate-y-5"), 10);
    setTimeout(() => {
        msg.classList.add("opacity-0", "-translate-y-5");
        setTimeout(() => msg.remove(), 400);
    }, 2000);
}

/* ---------------- RENDER TAREAS ---------------- */
/**
 * Pinta en pantalla la lista de tareas aplicando los filtros activos.
 */
function renderTasks() {
    const list = document.getElementById("taskList");
    list.innerHTML = "";

    const filters = getTaskFilters();
    const sortOption = getTaskSortOption();
    const currentTasks = Array.isArray(tasks) ? tasks : [];
    const filteredTasks = sortTasksForView(applyTaskFilters(currentTasks, filters), sortOption);

    filteredTasks.forEach(task => {
        const div = document.createElement("div");
        div.className = "task-card relative";

        div.innerHTML = `
        <div class="card-inner">
            <div class="card-front bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col relative h-full">
                <!-- Círculo de prioridad arriba a la derecha -->
                <div class="absolute top-3 right-3 w-3 h-3 rounded-full ${task.priority === 'Alta' ? 'bg-red-600' : task.priority === 'Media' ? 'bg-yellow-500' : 'bg-green-600'}" title="Prioridad: ${task.priority}"></div>
                
                <div class="flex items-start gap-3 pr-6 mb-2">
                    <input type="checkbox" ${task.completed ? "checked" : ""} onchange="toggleComplete('${task.id}')" class="mt-1 h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer">
                    <strong class="${task.completed ? 'line-through opacity-50' : ''} line-clamp-2 text-sm font-semibold flex-1 leading-snug">${task.title}</strong>
                </div>
                
                <div class="flex flex-col gap-0.5 mt-auto mb-6">
                    <small class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        ${formatDate(task.date)} ${task.time || ""}
                    </small>
                    <small class="text-xs text-gray-400 dark:text-gray-500">${task.category}</small>
                    ${task.isLocal ? `<span class="local-task-badge">Solo local (sin conexión)</span>` : ''}
                </div>

                <!-- Botones abajo en las esquinas -->
                <button class="absolute bottom-3 left-4 text-xs font-semibold text-blue-500 hover:text-blue-700 transition-colors"
                    onclick="openEditModal('${task.id}')">
                    Editar
                </button>
                <button class="absolute bottom-3 right-4 text-base text-gray-400 hover:text-red-600 transition-all hover:scale-110" 
                    onclick="promptDeleteTask('${task.id}')" aria-label="Eliminar tarea">
                    ✕
                </button>
            </div>
        </div>
        `;

        list.appendChild(div);
    });

    const counterElement = document.getElementById("taskCounter");
    if (counterElement) {
        if (tasks.length === 0) {
            counterElement.textContent = "No hay tareas todavía";
        } else if (filteredTasks.length === tasks.length) {
            counterElement.textContent = `${filteredTasks.length} tareas`;
        } else {
            counterElement.textContent = `${filteredTasks.length} de ${tasks.length} tareas`;
        }
    }

    updateTaskSummary();
}

/* ---------------- COMPLETAR ---------------- */
/**
 * Marca o desmarca una tarea como completada.
 * @param {number} id - Identificador único de la tarea.
 */
async function toggleComplete(id) {
    const task = tasks.find(t => String(t.id) === String(id));
    if (!task) return;
    
    const newStatus = !task.completed;
    
    try {
        await updateTask(id, { completed: newStatus });
        tasks = tasks.map(t => t.id === id ? { ...t, completed: newStatus } : t);
        
        if (newStatus) {
            launchConfetti();
            playSound();
        }
        
        renderTasks();
        renderCalendar();
    } catch (err) {
        alert("Error al actualizar la tarea en el servidor");
    }
}

/* ---------------- ELIMINAR ---------------- */
let taskToDeleteId = null;

/**
 * Abre el prompt de confirmación para eliminar.
 */
function promptDeleteTask(id) {
    taskToDeleteId = id;
    const modal = document.getElementById("confirmDeleteModal");
    if (modal) {
        modal.classList.remove("hidden");
        modal.classList.add("flex");
    }
}

/**
 * Cierra el prompt de confirmación.
 */
function closeConfirmDeleteModal() {
    taskToDeleteId = null;
    const modal = document.getElementById("confirmDeleteModal");
    if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
    }
}

/**
 * Confirma y elimina una tarea por id.
 */
async function confirmDeleteTask() {
    if (taskToDeleteId !== null) {
        try {
            await deleteTask(taskToDeleteId);
            tasks = tasks.filter(task => String(task.id) !== String(taskToDeleteId));
            // persistTasks(); 
            renderTasks();
            renderCalendar();
            closeConfirmDeleteModal();
        } catch (err) {
            alert("Error al eliminar la tarea en el servidor.");
        }
    }
}

/**
 * Marca todas las tareas como completadas.
 */
async function markAllCompleted() {
    const pendingTasks = tasks.filter(t => !t.completed);
    if (pendingTasks.length === 0) return;

    // Intentar actualizar cada una. No usamos Promise.all para que si una falla, las demás sigan.
    const results = await Promise.allSettled(pendingTasks.map(t => updateTask(t.id, { completed: true })));
    
    // Actualizamos el estado local de todas las que tuvieron éxito (o todas si queremos ser optimistas)
    tasks = tasks.map(task => {
        const result = results.find((r, i) => String(pendingTasks[i].id) === String(task.id));
        if (result && result.status === 'fulfilled') {
            return { ...task, completed: true };
        }
        return task;
    });
    
    // Si alguna falló, avisamos pero no bloqueamos
    const errors = results.filter(r => r.status === 'rejected');
    if (errors.length > 0) {
        console.warn(`${errors.length} tareas no pudieron actualizarse en el servidor.`);
    }

    launchConfetti();
    playSound();
    renderTasks();
    renderCalendar();
}

/**
 * Borra todas las tareas que están completadas.
 */
async function deleteAllCompleted() {
    const completedTasks = tasks.filter(t => t.completed);
    if (completedTasks.length === 0) return;

    // Intentar eliminar cada una
    const results = await Promise.allSettled(completedTasks.map(t => deleteTask(t.id)));
    
    // Filtramos las tareas locales eliminando las que se borraron con éxito
    tasks = tasks.filter(task => {
        const resultIndex = completedTasks.findIndex(t => String(t.id) === String(task.id));
        if (resultIndex === -1) return true; // No era una de las completadas
        return results[resultIndex].status !== 'fulfilled'; // Mantener si falló el borrado (o si queremos ser drásticos, borrar igual)
        // En realidad, para el usuario es mejor que desaparezcan si les dio a borrar
    });
    
    // Forzamos borrado local de todas si queremos que la UI sea coherente
    tasks = tasks.filter(t => !t.completed);

    renderTasks();
    renderCalendar();
}

/* ---------------- CALENDARIO ---------------- */
/**
 * Dibuja el calendario mensual con las tareas en sus días correspondientes.
 */
function renderCalendar() {
    const calendar = document.getElementById("calendar");
    calendar.innerHTML = "";

    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    document.getElementById("monthYear").textContent =
        currentDate.toLocaleString("es", { month: "long", year: "numeric" });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) calendar.innerHTML += "<div></div>";

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    for (let d = 1; d <= daysInMonth; d++) {
        const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayDiv = document.createElement("div");

        let dayClasses = "day bg-white dark:bg-gray-700 rounded-lg p-3 shadow-md cursor-pointer min-h-[80px] flex flex-col items-start gap-1 transition scrollbar-hide";
        if (fullDate === todayStr) {
            dayClasses += " border-2 border-primary bg-red-50 dark:bg-red-900/40 text-primary dark:text-red-400";
        }
        dayDiv.className = dayClasses;
        
        dayDiv.innerHTML = `<strong class="text-sm font-semibold">${d}</strong>`;

        tasks.filter(t => t.date === fullDate).forEach(t => {
            const strikeClass = t.completed ? "line-through opacity-50" : "";
            dayDiv.innerHTML += `<div class="text-xs truncate w-full ${strikeClass}">${t.title}</div>`;
        });

        dayDiv.onclick = () => showModal(fullDate);
        calendar.appendChild(dayDiv);
    }
}

/**
 * Actualiza el panel de resumen de tareas en la vista de inicio.
 */
function updateTaskSummary() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const pendingTasks = totalTasks - completedTasks;

    // Obtener la fecha local en formato YYYY-MM-DD correcta para comparar
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayKey = `${year}-${month}-${day}`;

    const todayTasks = tasks.filter(task => task.date === todayKey).length;

    const totalElement = document.getElementById("summaryTotal");
    const completedElement = document.getElementById("summaryCompleted");
    const pendingElement = document.getElementById("summaryPending");
    const todayElement = document.getElementById("summaryToday");
    const progressBar = document.getElementById("summaryProgressBar");

    if (totalElement) totalElement.textContent = totalTasks.toString();
    if (completedElement) completedElement.textContent = completedTasks.toString();
    if (pendingElement) pendingElement.textContent = pendingTasks.toString();
    if (todayElement) todayElement.textContent = todayTasks.toString();

    if (progressBar) {
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        progressBar.style.width = `${progress}%`;
    }
}

/**
 * Función activada al hacer click en los marcadores del Dashboard de Inicio.
 * Navega a la vista de tareas y pre-aplica los filtros correspondientes.
 * @param {string} filterType - 'all', 'completed', 'pending' o 'today'
 */
function filterFromSummary(filterType) {
    // Resetear todos los filtros primero (y la variable global)
    resetTaskFilters();

    const statusSelect = document.getElementById("filterStatus");

    if (filterType === 'completed' || filterType === 'pending') {
        if (statusSelect) statusSelect.value = filterType;
    } else if (filterType === 'today') {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        window.currentDateFilter = `${year}-${month}-${day}`;
        // Dejamos el selector de estado en "all"
    }

    // Mostramos la vista y re-renderizamos la lista
    showView('tasksView');
    renderTasks();
}

/* ---------------- MODAL ---------------- */
/**
 * Muestra las tareas de un día concreto en el modal.
 * @param {string} date - Fecha en formato YYYY-MM-DD.
 */
function showModal(date) {
    const modal = document.getElementById("calendarModal");
    modal.style.display = "flex";
    document.getElementById("modalTitle").textContent = "Tareas del " + formatDate(date);

    // Botón para añadir en este día
    const addBtn = document.getElementById("addCalendarTaskBtn");
    if (addBtn) {
        addBtn.onclick = () => {
            closeModal();
            openNewTaskModal(date);
        };
    }

    const modalTasks = document.getElementById("modalTasks");
    modalTasks.innerHTML = "";

    tasks.filter(t => t.date === date).forEach(task => {
        const div = document.createElement("div");
        div.className = "task-card p-2 bg-white dark:bg-gray-800 rounded shadow mb-2";
        div.innerHTML = `
            <strong class="${task.completed ? 'line-through opacity-60' : ''}">${task.title}</strong>
            <small>${task.time || ""}</small>
            <small>${task.category}</small>
        `;
        modalTasks.appendChild(div);
    });
}

/**
 * Abre el modal de edición para la tarea indicada.
 * @param {number} taskId - Identificador de la tarea a editar.
 */
function openEditModal(taskId) {
    const taskToEdit = tasks.find(task => String(task.id) === String(taskId));
    if (!taskToEdit) {
        return;
    }

    editingTaskId = taskId;

    const titleInput = document.getElementById("editTaskTitle");
    const dayInput = document.getElementById("editTaskDay");
    const monthInput = document.getElementById("editTaskMonth");
    const yearInput = document.getElementById("editTaskYear");

    const timeInput = document.getElementById("editTaskTime");
    const categoryInput = document.getElementById("editTaskCategory");
    const prioritySelect = document.getElementById("editTaskPriority");
    const modal = document.getElementById("editTaskModal");

    if (titleInput) titleInput.value = taskToEdit.title;
    if (taskToEdit.date) {
        const [year, month, day] = taskToEdit.date.split("-");
        if (dayInput) dayInput.value = day;
        if (monthInput) monthInput.value = month;
        if (yearInput) yearInput.value = year;
    }
    if (timeInput) timeInput.value = taskToEdit.time || "";
    if (categoryInput) categoryInput.value = taskToEdit.category || "";
    if (prioritySelect) prioritySelect.value = taskToEdit.priority;

    if (modal) {
        modal.classList.remove("hidden");
        modal.classList.add("flex");
    }
}

/**
 * Cierra el modal de edición de tarea sin guardar cambios.
 */
function closeEditModal() {
    const modal = document.getElementById("editTaskModal");
    if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
    }
    editingTaskId = null;
}

/**
 * Guarda los cambios realizados sobre la tarea abierta en el modal de edición.
 */
async function saveTaskEdits() {
    if (editingTaskId === null) {
        return;
    }

    const titleInput = document.getElementById("editTaskTitle");
    const dayInput = document.getElementById("editTaskDay");
    const monthInput = document.getElementById("editTaskMonth");
    const yearInput = document.getElementById("editTaskYear");

    const timeInput = document.getElementById("editTaskTime");
    const categoryInput = document.getElementById("editTaskCategory");
    const prioritySelect = document.getElementById("editTaskPriority");

    const editedTitle = titleInput.value.trim();
    const editedDate = `${yearInput.value}-${monthInput.value}-${dayInput.value}`;
    const editedTime = timeInput.value;
    const editedCategory = categoryInput.value.trim() || "Sin categoría";
    const editedPriority = prioritySelect.value;

    if (!editedTitle || !dayInput.value || !monthInput.value || !yearInput.value) {
        alert("Debes indicar al menos un título y una fecha válida.");
        return;
    }

    if (editedTitle.length < 3) {
        alert("El título debe tener al menos 3 caracteres.");
        return;
    }

    if (editedTitle.length > 100) {
        alert("El título es demasiado largo (máximo 100 caracteres).");
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(editedDate);
    if (selectedDate < today) {
        alert("La fecha no puede estar en el pasado.");
        return;
    }

    const editedTaskData = {
        title: editedTitle,
        date: editedDate,
        time: editedTime,
        category: editedCategory,
        priority: editedPriority
    };

    try {
        await updateTask(editingTaskId, editedTaskData);
        tasks = tasks.map(task => {
            if (String(task.id) !== String(editingTaskId)) return task;
            return {
                ...task,
                ...editedTaskData
            };
        });

        tasks = sortTasksByDateTime(tasks);
        renderTasks();
        renderCalendar();
        closeEditModal();
    } catch (err) {
        alert("Error al guardar los cambios en el servidor.");
    }
}

/**
 * Abre el modal de nueva tarea.
 * @param {string|null} presetDate - Opcional. Permite rellenar la fecha automáticamente.
 */
function openNewTaskModal(presetDate = null) {
    const modal = document.getElementById("newTaskModal");
    if (modal) {
        modal.classList.remove("hidden");
        modal.classList.add("flex");
    }

    let dateToUse = presetDate;
    
    // Si no viene fecha del calendario (click en el botón +), usamos hoy por defecto
    if (!dateToUse) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        dateToUse = `${year}-${month}-${day}`;
    }

    if (dateToUse) {
        const [year, month, day] = dateToUse.split("-");
        const dayInput = document.getElementById("taskDay");
        const monthInput = document.getElementById("taskMonth");
        const yearInput = document.getElementById("taskYear");

        if (dayInput) dayInput.value = day;
        if (monthInput) monthInput.value = month;
        if (yearInput) yearInput.value = year;
    }
}

/**
 * Cierra el modal de nueva tarea.
 */
function closeNewTaskModal() {
    const modal = document.getElementById("newTaskModal");
    if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
    }
}

function closeModal() {
    document.getElementById("calendarModal").style.display = "none";
}

// Cerrar modal al pulsar ESC y al hacer click fuera
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        closeModal();
        closeEditModal();
        closeNewTaskModal();
        closeConfirmDeleteModal();
    }
});

document.getElementById("calendarModal").addEventListener("click", (e) => {
    if (e.target.id === "calendarModal") {
        closeModal();
    }
});

/**
 * Cambia el mes visible en el calendario.
 * @param {number} step - Número de meses a desplazar (positivo o negativo).
 */
function changeMonth(step) {
    currentDate.setMonth(currentDate.getMonth() + step);
    renderCalendar();
}

/* ---------------- EFECTOS ---------------- */
/**
 * Lanza pequeñas partículas de confeti desde la parte superior de la pantalla.
 */
function launchConfetti() {
    for (let i = 0; i < 15; i++) {
        let conf = document.createElement("div");
        conf.className = "confetti";
        conf.style.left = Math.random() * 100 + "vw";
        conf.style.backgroundColor = `hsl(${Math.random() * 360},70%,50%)`;
        conf.style.animationDuration = (Math.random() * 2 + 1) + "s";
        document.body.appendChild(conf);
        setTimeout(() => conf.remove(), 3000);
    }
}

const completeAudio = new Audio("https://www.soundjay.com/buttons/sounds/button-16.mp3");
completeAudio.volume = 0.4;

/**
 * Reproduce el sonido de tarea completada.
 */
function playSound() {
    completeAudio.currentTime = 0;
    completeAudio.play();
}

/* ---------------- FORMATEAR FECHA ---------------- */
/**
 * Convierte una fecha YYYY-MM-DD a DD/MM/YYYY.
 * @param {string} dateString - Fecha en formato estándar.
 * @returns {string} Fecha formateada para mostrar.
 */
function formatDate(dateString) {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
}



/* ---------------- MODO OSCURO ---------------- */
document.getElementById("darkToggle").addEventListener("click", () => {
    rootElement.classList.toggle("dark");
    localStorage.setItem("theme", rootElement.classList.contains("dark") ? "dark" : "light");
});