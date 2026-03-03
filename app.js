let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentDate = new Date();

const emojiMap = {
    "deporte": "⚽",
    "comida": "🍔",
    "trabajo": "💼",
    "estudio": "📚",
    "salud": "💊",
    "otro": "✨"
};

document.addEventListener("DOMContentLoaded", () => {
    renderTasks();
    renderCalendar();
});

// VISTA
function showView(id) {
    document.getElementById("tasksView").style.display = "none";
    document.getElementById("calendarView").style.display = "none";
    document.getElementById(id).style.display = "block";
    closeCalendarZoom();
}

// AÑADIR TAREA
function addTask() {
    const title = document.getElementById("taskTitle").value.trim();
    const date = document.getElementById("taskDate").value;
    const time = document.getElementById("taskTime").value;
    let category = document.getElementById("taskCategory").value.trim();
    const priority = document.getElementById("taskPriority").value;

    if (!title || !date) return;

    if (!category) category = "Otro";

    let emoji = "";
    Object.keys(emojiMap).forEach(key => {
        if (category.toLowerCase().includes(key)) emoji = emojiMap[key];
    });
    if (!emoji) emoji = emojiMap["otro"];

    tasks.push({
        id: Date.now(),
        title: title + " " + emoji,
        date,
        time,
        category,
        priority,
        completed: false
    });

    tasks.sort((a, b) => {
        let da = a.date + (a.time || "00:00");
        let db = b.date + (b.time || "00:00");
        return da.localeCompare(db);
    });

    localStorage.setItem("tasks", JSON.stringify(tasks));
    document.getElementById("taskTitle").value = "";
    document.getElementById("taskTime").value = "";
    document.getElementById("taskCategory").value = "";

    const btn = document.getElementById("addBtn");
    btn.classList.add("success");
    btn.textContent = "✓ Añadido";
    setTimeout(() => { btn.classList.remove("success"); btn.textContent = "Añadir"; }, 1500);

    renderTasks();
    renderCalendar();
}

// RENDER TAREAS
function renderTasks() {
    const list = document.getElementById("taskList");
    list.innerHTML = "";

    const search = document.getElementById("searchInput").value.toLowerCase();
    const filterPriority = document.getElementById("filterPriority").value;
    const filterCategory = document.getElementById("filterCategory").value.toLowerCase();
    const filterDate = document.getElementById("filterDate").value;

    tasks
        .filter(t => t.title.toLowerCase().includes(search))
        .filter(t => filterPriority === "all" || t.priority === filterPriority)
        .filter(t => !filterCategory || t.category.toLowerCase().includes(filterCategory))
        .filter(t => !filterDate || t.date === filterDate)
        .forEach(task => {
            const card = document.createElement("div");
            card.className = "task-card" + (task.completed ? " completed" : "");
            card.innerHTML = `
<button class="delete-btn" onclick="deleteTask(${task.id})">✕</button>
<input type="checkbox" ${task.completed ? "checked" : ""} onclick="toggleComplete(${task.id})">
<strong>${task.title}</strong>
<small>${task.category} | ${task.date}${task.time ? " " + task.time : ""}</small>
<span class="badge priority-${task.priority.toLowerCase()}">${task.priority}</span>
`;
            list.appendChild(card);
        });

    const applyBtn = document.getElementById("applyBtn");
    applyBtn.classList.add("success");
    applyBtn.textContent = "✓ Aplicado";
    setTimeout(() => { applyBtn.classList.remove("success"); applyBtn.textContent = "Aplicar filtros"; }, 1200);
}

// COMPLETAR
function toggleComplete(id) {
    tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    localStorage.setItem("tasks", JSON.stringify(tasks));
    renderTasks();
    renderCalendar();
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

        const dayTasks = tasks.filter(t => t.date === fullDate);
        if (dayTasks.length) {
            dayDiv.style.border = "2px solid #e10600";
            let tasksHTML = "";
            dayTasks.slice(0, 3).forEach(t => { tasksHTML += `<div class="day-tasks">${t.title}</div>`; });
            dayDiv.innerHTML += tasksHTML;
        }

        dayDiv.onclick = () => {
            if (dayTasks.length) showCalendarZoom(fullDate);
        };

        calendar.appendChild(dayDiv);
    }
}

// ZOOM CALENDARIO
function showCalendarZoom(date) {
    document.getElementById("calendarDayDetail").style.display = "flex";
    document.getElementById("calendarTaskTitle").textContent = "Tareas del " + date;
    renderCalendarTasks(date);
}

function closeCalendarZoom() {
    document.getElementById("calendarDayDetail").style.display = "none";
}

function renderCalendarTasks(date) {
    const list = document.getElementById("calendarTaskList");
    list.innerHTML = "";
    tasks.filter(t => t.date === date).forEach(t => {
        const div = document.createElement("div");
        div.className = "calendar-task";
        div.innerHTML = `<strong>${t.title}</strong> <small>${t.time ? t.time : ""} | ${t.category}</small>`;
        list.appendChild(div);
    });
}

// CAMBIAR MES
function changeMonth(step) {
    currentDate.setMonth(currentDate.getMonth() + step);
    renderCalendar();
}