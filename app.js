let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let categories = JSON.parse(localStorage.getItem("categories")) || ["Trabajo", "Hogar", "Personales", "Otro"];
let currentDate = new Date();

// INICIO
document.addEventListener("DOMContentLoaded", () => {
    renderCategories();
    renderTasks();
    renderCalendar();
});

// CAMBIAR VISTA
function showView(id) {
    document.getElementById("tasksView").style.display = "none";
    document.getElementById("calendarView").style.display = "none";
    document.getElementById(id).style.display = "block";
}

// CATEGORÍAS
function renderCategories() {
    const select = document.getElementById("taskCategory");
    const filterSelect = document.getElementById("filterCategory");

    select.innerHTML = "";
    filterSelect.innerHTML = '<option value="all">Todas categorías</option>';

    categories.forEach(cat => {
        select.innerHTML += `<option value="${cat}">${cat}</option>`;
        filterSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
}

// AÑADIR TAREA
function addTask() {
    const title = document.getElementById("taskTitle").value.trim();
    const date = document.getElementById("taskDate").value;
    const category = document.getElementById("taskCategory").value;
    const priority = document.getElementById("taskPriority").value;

    if (!title || !date) return;

    tasks.push({
        id: Date.now(),
        title,
        date,
        category,
        priority,
        completed: false
    });

    localStorage.setItem("tasks", JSON.stringify(tasks));
    renderTasks();
    renderCalendar();

    document.getElementById("taskTitle").value = "";

    // feedback visual
    const btn = document.getElementById("addBtn");
    btn.classList.add("success");
    btn.textContent = "✓ Añadido";
    setTimeout(() => {
        btn.classList.remove("success");
        btn.textContent = "Añadir";
    }, 1500);
}

// RENDER TAREAS
function renderTasks() {
    const list = document.getElementById("taskList");
    list.innerHTML = "";

    const search = document.getElementById("searchInput").value.toLowerCase();
    const filterPriority = document.getElementById("filterPriority").value;
    const filterCategory = document.getElementById("filterCategory").value;
    const filterDate = document.getElementById("filterDate").value;

    tasks
        .filter(t => t.title.toLowerCase().includes(search))
        .filter(t => filterPriority === "all" || t.priority === filterPriority)
        .filter(t => filterCategory === "all" || t.category === filterCategory)
        .filter(t => !filterDate || t.date === filterDate)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .forEach(task => {
            const card = document.createElement("div");
            card.className = "task-card" + (task.completed ? " completed" : "");

            card.innerHTML = `
<button class="delete-btn" onclick="deleteTask(${task.id})">✕</button>
<input type="checkbox" ${task.completed ? "checked" : ""} onclick="toggleComplete(${task.id})">
<strong>${task.title}</strong>
<small>${task.category} | ${task.date}</small>
<span class="badge priority-${task.priority.toLowerCase()}">${task.priority}</span>
`;

            list.appendChild(card);
        });

    // feedback filtros
    const applyBtn = document.getElementById("applyBtn");
    applyBtn.classList.add("success");
    applyBtn.textContent = "✓ Aplicado";
    setTimeout(() => {
        applyBtn.classList.remove("success");
        applyBtn.textContent = "Aplicar filtros";
    }, 1200);
}

// COMPLETAR
function toggleComplete(id) {
    tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    localStorage.setItem("tasks", JSON.stringify(tasks));
    renderTasks();
}

// ELIMINAR
function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    localStorage.setItem("tasks", JSON.stringify(tasks));
    renderTasks();
    renderCalendar();
}

// CALENDARIO
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
        dayDiv.className = "day";
        dayDiv.innerHTML = `<strong>${d}</strong>`;

        if (tasks.some(t => t.date === fullDate)) {
            dayDiv.style.border = "2px solid #e10600";
        }

        dayDiv.onclick = () => {
            showView("calendarView");
            document.getElementById("calendarTaskTitle").textContent = "Tareas del " + fullDate;
            renderCalendarTasks(fullDate);
        };

        calendar.appendChild(dayDiv);
    }
}

function renderCalendarTasks(date) {
    const list = document.getElementById("calendarTaskList");
    list.innerHTML = "";

    tasks.filter(t => t.date === date).forEach(t => {
        list.innerHTML += `<div class="calendar-task">${t.title}</div>`;
    });
}

function changeMonth(step) {
    currentDate.setMonth(currentDate.getMonth() + step);
    renderCalendar();
}