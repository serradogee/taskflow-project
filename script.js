document.addEventListener("DOMContentLoaded", function () {
    const taskForm = document.getElementById("taskForm");
    const taskList = document.getElementById("taskList");

    taskForm.addEventListener("submit", function (event) {
        event.preventDefault();

        // Obtener los valores del formulario
        const taskTitle = document.getElementById("taskTitle").value;
        const taskCategory = document.getElementById("taskCategory").value;
        const taskPriority = document.getElementById("taskPriority").value;

        // Crear una nueva tarea
        const task = document.createElement("article");
        task.classList.add("task");

        // Determinar la clase de prioridad según el valor seleccionado
        let priorityClass = "";
        if (taskPriority === "Alta") {
            priorityClass = "priority-high";
        } else if (taskPriority === "Media/Alta") {
            priorityClass = "priority-medium-high";
        } else if (taskPriority === "Baja") {
            priorityClass = "priority-low";
        }

        // Crear el contenido de la tarea
        task.innerHTML = `
            <label>
                <input type="checkbox" class="task-checkbox">
                <h2 class="task-title">${taskTitle}</h2>
            </label>
            <p class="task-category">Categoría: ${taskCategory}</p>
            <span class="badge ${priorityClass}">${taskPriority}</span>
        `;

        // Añadir el evento para marcar la tarea como completada
        const checkbox = task.querySelector('.task-checkbox');
        checkbox.addEventListener('change', function () {
            task.classList.toggle('completed', checkbox.checked); // Cambiar clase cuando se marque
        });

        // Agregar la tarea a la lista
        taskList.appendChild(task);

        // Limpiar el formulario
        taskForm.reset();
    });
});