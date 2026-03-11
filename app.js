gilet tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentDate = new Date();
let editingTaskId = null;

// Preferencia de tema
const rootElement = document.documentElement;
const storedTheme = localStorage.getItem("theme");
if (storedTheme === "dark") {
    rootElement.classList.add("dark");
}

/**
 * Guarda el array de tareas actual en localStorage.
 */
function persistTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

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
 * @returns {{title: string, date: string, category: string, priority: string}} Filtros normalizados.
 */
function getTaskFilters() {
    const titleFilter = document.getElementById("filterName")?.value.toLowerCase() || "";
    const dateFilter = document.getElementById("filterDay")?.value || "";
    const categoryFilter = document.getElementById("filterCategory")?.value.toLowerCase() || "";
    const priorityFilter = document.getElementById("filterPriority")?.value || "all";

    return {
        title: titleFilter,
        date: dateFilter,
        category: categoryFilter,
        priority: priorityFilter
    };
}

/**
 * Aplica los filtros del listado de tareas sobre una lista dada.
 * @param {Array<Object>} taskList - Lista de tareas de entrada.
 * @param {{title: string, date: string, category: string, priority: string}} filters - Filtros a aplicar.
 * @returns {Array<Object>} Lista filtrada.
 */
function applyTaskFilters(taskList, filters) {
    return taskList
        .filter(task => task.title.toLowerCase().includes(filters.title))
        .filter(task => !filters.date || task.date === filters.date)
        .filter(task => task.category.toLowerCase().includes(filters.category))
        .filter(task => filters.priority === "all" || task.priority === filters.priority);
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
    const dayInput = document.getElementById("filterDay");
    const categoryInput = document.getElementById("filterCategory");
    const prioritySelect = document.getElementById("filterPriority");

    if (nameInput) nameInput.value = "";
    if (dayInput) dayInput.value = "";
    if (categoryInput) categoryInput.value = "";
    if (prioritySelect) prioritySelect.value = "all";

    renderTasks();
}

document.addEventListener("DOMContentLoaded", () => {
    tasks = sortTasksByDateTime(tasks);
    renderTasks();
    renderCalendar();
    updateTaskSummary();
});

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

    if (id === "homeView") document.querySelectorAll("nav button")[0].classList.add("active");
    if (id === "tasksView") document.querySelectorAll("nav button")[1].classList.add("active");
    if (id === "calendarView") document.querySelectorAll("nav button")[2].classList.add("active");
}

/* ---------------- CREAR TAREA ---------------- */
/**
 * Valida los datos del formulario y crea una nueva tarea.
 */
function addTask() {
    const titleInput = document.getElementById("taskTitle");
    const dateInput = document.getElementById("taskDate");
    const timeInput = document.getElementById("taskTime");
    const categoryInput = document.getElementById("taskCategory");
    const prioritySelect = document.getElementById("taskPriority");

    const title = titleInput.value.trim();
    const date = dateInput.value;
    const time = timeInput.value;
    const category = categoryInput.value.trim() || "Sin categoría";
    const priority = prioritySelect.value;

    // Validación básica de campos obligatorios
    if (!title || !date) {
        alert("Debes indicar al menos un título y una fecha.");
        return;
    }

    // Validación de longitud del título
    if (title.length < 3) {
        alert("El título debe tener al menos 3 caracteres.");
        return;
    }

    if (title.length > 100) {
        alert("El título es demasiado largo (máximo 100 caracteres).");
        return;
    }

    // Validación de fecha en el pasado
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);
    if (selectedDate < today) {
        alert("La fecha no puede estar en el pasado.");
        return;
    }

    const newTask = {
        id: Date.now(),
        title,
        date,
        time,
        category,
        priority,
        completed: false
    };

    tasks = sortTasksByDateTime([...tasks, newTask]);
    persistTasks();

    titleInput.value = "";
    timeInput.value = "";
    categoryInput.value = "";

    renderTasks();
    renderCalendar();
    showTaskCreatedMessage();
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
    const filteredTasks = sortTasksForView(applyTaskFilters(tasks, filters), sortOption);

    filteredTasks.forEach(task => {
        const div = document.createElement("div");
        div.className = "task-card relative";

        // Colores según prioridad
        let priorityColor = '';
        if (task.priority === 'Alta') priorityColor = 'bg-red-600';
        else if (task.priority === 'Media') priorityColor = 'bg-yellow-500';
        else if (task.priority === 'Baja') priorityColor = 'bg-green-600';

        div.innerHTML = `
        <div class="card-inner">
            <div class="card-front bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md flex flex-col gap-2">
                <div class="flex items-center gap-2">
                    <input type="checkbox" ${task.completed ? "checked" : ""} onchange="toggleComplete(${task.id})" class="h-5 w-5 cursor-pointer">
                    <strong class="${task.completed ? 'line-through opacity-60' : ''} truncate">${task.title}</strong>
                </div>
                <small>${formatDate(task.date)} ${task.time || ""}</small>
                <small>${task.category}</small>
                <span class="px-3 py-1 rounded-full text-white text-sm ${priorityColor}">${task.priority}</span>
            </div>
        </div>
        <div class="absolute bottom-2 right-2 flex gap-1">
            <button class="delete-btn text-red-600 hover:scale-125 transition-transform" onclick="deleteTask(${task.id})" aria-label="Eliminar tarea">✕</button>
            <button class="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                onclick="openEditModal(${task.id})">
                Editar
            </button>
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
function toggleComplete(id) {
    tasks = tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task);
    persistTasks();

    const task = tasks.find(t => t.id === id);
    if (task.completed) {
        launchConfetti();
        playSound();
    }

    renderTasks();
    renderCalendar();
}

/* ---------------- ELIMINAR ---------------- */
/**
 * Elimina una tarea por id.
 * @param {number} id - Identificador único de la tarea.
 */
function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    persistTasks();
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

    for (let d = 1; d <= daysInMonth; d++) {
        const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayDiv = document.createElement("div");

        dayDiv.className = "day bg-white dark:bg-gray-700 rounded-lg p-3 shadow-md cursor-pointer min-h-[80px] flex flex-col items-start gap-1";
        dayDiv.innerHTML = `<strong class="text-sm font-semibold">${d}</strong>`;

        tasks.filter(t => t.date === fullDate).forEach(t => {
            dayDiv.innerHTML += `<div class="text-xs truncate">${t.title}</div>`;
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = today.toISOString().slice(0, 10);
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

/* ---------------- MODAL ---------------- */
/**
 * Muestra las tareas de un día concreto en el modal.
 * @param {string} date - Fecha en formato YYYY-MM-DD.
 */
function showModal(date) {
    const modal = document.getElementById("calendarModal");
    modal.style.display = "flex";
    document.getElementById("modalTitle").textContent = "Tareas del " + formatDate(date);

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
    const taskToEdit = tasks.find(task => task.id === taskId);
    if (!taskToEdit) {
        return;
    }

    editingTaskId = taskId;

    const titleInput = document.getElementById("editTaskTitle");
    const dateInput = document.getElementById("editTaskDate");
    const timeInput = document.getElementById("editTaskTime");
    const categoryInput = document.getElementById("editTaskCategory");
    const prioritySelect = document.getElementById("editTaskPriority");
    const modal = document.getElementById("editTaskModal");

    if (titleInput) titleInput.value = taskToEdit.title;
    if (dateInput) dateInput.value = taskToEdit.date;
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
function saveTaskEdits() {
    if (editingTaskId === null) {
        return;
    }

    const titleInput = document.getElementById("editTaskTitle");
    const dateInput = document.getElementById("editTaskDate");
    const timeInput = document.getElementById("editTaskTime");
    const categoryInput = document.getElementById("editTaskCategory");
    const prioritySelect = document.getElementById("editTaskPriority");

    const editedTitle = titleInput.value.trim();
    const editedDate = dateInput.value;
    const editedTime = timeInput.value;
    const editedCategory = categoryInput.value.trim() || "Sin categoría";
    const editedPriority = prioritySelect.value;

    if (!editedTitle || !editedDate) {
        alert("Debes indicar al menos un título y una fecha.");
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

    tasks = tasks.map(task => {
        if (task.id !== editingTaskId) return task;
        return {
            ...task,
            title: editedTitle,
            date: editedDate,
            time: editedTime,
            category: editedCategory,
            priority: editedPriority
        };
    });

    tasks = sortTasksByDateTime(tasks);
    persistTasks();
    renderTasks();
    renderCalendar();
    closeEditModal();
}

function closeModal() {
    document.getElementById("calendarModal").style.display = "none";
}

// Cerrar modal al pulsar ESC y al hacer click fuera
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        closeModal();
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