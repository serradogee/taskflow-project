let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentDate = new Date();

document.addEventListener("DOMContentLoaded", () => {
    renderTasks();
    renderCalendar();
});

/* ---------------- VISTAS ---------------- */

function showView(id) {
    document.getElementById("homeView").style.display = "none";
    document.getElementById("tasksView").style.display = "none";
    document.getElementById("calendarView").style.display = "none";

    document.getElementById(id).style.display = "block";

    document.querySelectorAll("nav button").forEach(btn => btn.classList.remove("active"));

    if (id === "homeView") document.querySelectorAll("nav button")[0].classList.add("active");
    if (id === "tasksView") document.querySelectorAll("nav button")[1].classList.add("active");
    if (id === "calendarView") document.querySelectorAll("nav button")[2].classList.add("active");
}

/* ---------------- CREAR TAREA ---------------- */

function addTask() {
    const title = document.getElementById("taskTitle").value.trim();
    const date = document.getElementById("taskDate").value;
    const time = document.getElementById("taskTime").value;
    const category = document.getElementById("taskCategory").value.trim() || "Sin categoría";
    const priority = document.getElementById("taskPriority").value;

    if (!title || !date) {
        alert("Debes poner título y fecha");
        return;
    }

    tasks.push({
        id: Date.now(),
        title,
        date,
        time,
        category,
        priority,
        completed: false
    });

    // Ordenar por fecha y hora
    tasks.sort((a, b) => {
        const da = a.date + (a.time || "23:59");
        const db = b.date + (b.time || "23:59");
        return da.localeCompare(db);
    });

    localStorage.setItem("tasks", JSON.stringify(tasks));

    document.getElementById("taskTitle").value = "";
    document.getElementById("taskTime").value = "";
    document.getElementById("taskCategory").value = "";

    renderTasks();
    renderCalendar();

    showTaskCreatedMessage();
}

/* ---------------- MENSAJE TEMPORAL ---------------- */

function showTaskCreatedMessage() {
    const msg = document.createElement("div");
    msg.textContent = "✅ Tarea creada";
    msg.style.position = "fixed";
    msg.style.top = "20px";
    msg.style.right = "20px";
    msg.style.background = "#16a34a";
    msg.style.color = "white";
    msg.style.padding = "12px 20px";
    msg.style.borderRadius = "12px";
    msg.style.boxShadow = "0 5px 20px rgba(0,0,0,0.1)";
    msg.style.zIndex = 1000;
    msg.style.fontWeight = "600";
    msg.style.opacity = "0";
    msg.style.transition = "opacity 0.4s, transform 0.4s";
    msg.style.transform = "translateY(-20px)";

    document.body.appendChild(msg);

    setTimeout(() => {
        msg.style.opacity = "1";
        msg.style.transform = "translateY(0)";
    }, 10);

    setTimeout(() => {
        msg.style.opacity = "0";
        msg.style.transform = "translateY(-20px)";
        setTimeout(() => msg.remove(), 400);
    }, 2000);
}

/* ---------------- RENDER TAREAS ---------------- */

function renderTasks() {
    const list = document.getElementById("taskList");
    list.innerHTML = "";

    const name = document.getElementById("filterName").value.toLowerCase();
    const day = document.getElementById("filterDay").value;
    const category = document.getElementById("filterCategory").value.toLowerCase();
    const priority = document.getElementById("filterPriority").value;

    let filtered = tasks
        .filter(t => t.title.toLowerCase().includes(name))
        .filter(t => !day || t.date === day)
        .filter(t => t.category.toLowerCase().includes(category))
        .filter(t => priority === "all" || t.priority === priority);

    // Separar pendientes y completadas
    let pending = filtered.filter(t => !t.completed);
    let completed = filtered.filter(t => t.completed);

    [...pending, ...completed].forEach(task => {
        const div = document.createElement("div");
        div.className = "task-card";
        if (task.completed) div.classList.add("flipped");

        div.innerHTML = `
        <div class="card-inner">
            <div class="card-front">
                <div class="task-top">
                    <input type="checkbox" ${task.completed ? "checked" : ""} onchange="toggleComplete(${task.id})">
                    <strong class="${task.completed ? 'done-text' : ''}">${task.title}</strong>
                </div>
                <small>${formatDate(task.date)} ${task.time || ""}</small>
                <small>${task.category}</small>
                <span class="badge priority-${task.priority.toLowerCase()}">${task.priority}</span>
            </div>

            <div class="card-back">
                <strong class="done-text">${task.title}</strong>
                <small>${formatDate(task.date)} ${task.time || ""}</small>
            </div>
        </div>

        <button class="delete-btn" onclick="deleteTask(${task.id})">✕</button>
        `;

        list.appendChild(div);
    });
}

/* ---------------- COMPLETAR ---------------- */

function toggleComplete(id) {
    tasks = tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task);
    localStorage.setItem("tasks", JSON.stringify(tasks));

    const task = tasks.find(t => t.id === id);

    if (task.completed) {
        launchConfetti();
        playSound();
    }

    renderTasks();
    renderCalendar();
}

/* ---------------- ELIMINAR ---------------- */

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    localStorage.setItem("tasks", JSON.stringify(tasks));
    renderTasks();
    renderCalendar();
}

/* ---------------- CALENDARIO ---------------- */

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

        tasks.filter(t => t.date === fullDate).forEach(t => {
            dayDiv.innerHTML += `<div style="font-size:11px">${t.title}</div>`;
        });

        dayDiv.onclick = () => showModal(fullDate);
        calendar.appendChild(dayDiv);
    }
}

/* ---------------- MODAL ---------------- */

function showModal(date) {
    document.getElementById("calendarModal").style.display = "flex";
    document.getElementById("modalTitle").textContent = "Tareas del " + formatDate(date);

    const modalTasks = document.getElementById("modalTasks");
    modalTasks.innerHTML = "";

    tasks.filter(t => t.date === date).forEach(task => {
        const div = document.createElement("div");
        div.className = "task-card";
        div.innerHTML = `
            <strong>${task.title}</strong>
            <small>${task.time || ""}</small>
            <small>${task.category}</small>
        `;
        modalTasks.appendChild(div);
    });
}

function closeModal() {
    document.getElementById("calendarModal").style.display = "none";
}

function changeMonth(step) {
    currentDate.setMonth(currentDate.getMonth() + step);
    renderCalendar();
}

/* ---------------- EFECTOS ---------------- */

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

function playSound() {
    let audio = new Audio("https://www.soundjay.com/buttons/sounds/button-16.mp3");
    audio.volume = 0.4;
    audio.play();
}

/* ---------------- FORMATEAR FECHA ---------------- */

function formatDate(dateString) {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
}