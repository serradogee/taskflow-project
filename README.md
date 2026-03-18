## TaskFlow - Gestor de tareas sencillo

TaskFlow es una pequeña aplicación web para **organizar tus tareas diarias** de forma visual y rápida.  
Puedes crear tareas con fecha, hora, categoría y prioridad, verlas en un listado filtrable y también en un **calendario mensual**.  
Incluye un **resumen de progreso**, modo oscuro y pequeños detalles visuales (confeti y sonido) al completar tareas.

La aplicación está construida solo con **HTML**, **Tailwind CSS (CDN)** y **JavaScript**, sin backend ni build tools. Todos los datos se guardan en el **localStorage** del navegador.

---

## Instalación

1. **Clona o descarga** este repositorio:

```bash
git clone <URL_DE_TU_REPOSITORIO>
cd taskflow-project
```

2. No necesitas instalar dependencias para usar la app básica. Solo asegúrate de tener un navegador moderno.

3. Abre el archivo `index.html` en tu navegador:

- O bien haciendo doble clic sobre `index.html`  
- O sirviendo la carpeta con un servidor estático sencillo, por ejemplo:

```bash
npx serve .
```

Luego visita `http://localhost:3000` (o el puerto que indique el comando).

---

## Uso

### Crear una tarea

1. En la vista **Inicio**, rellena:
   - **Título de la tarea** (obligatorio, mínimo 3 caracteres).
   - **Fecha** (obligatoria, no puede ser una fecha pasada).
   - **Hora** (opcional).
   - **Categoría** (opcional, por ejemplo: Trabajo, Estudios, Personal…).
   - **Prioridad** (Alta, Media o Baja).
2. Haz clic en **“Crear Tarea”**.
3. La tarea se guardará y aparecerá en:
   - La vista **Tareas** (lista filtrable y ordenable).
   - La vista **Calendario** en el día correspondiente.

### Ver y filtrar tareas

En la vista **Tareas**:

- Puedes filtrar por:
  - **Nombre** (búsqueda por texto en el título).
  - **Día** (fecha exacta).
  - **Categoría**.
  - **Prioridad**.
- Puedes elegir el **orden** de la lista:
  - Fecha (más próximas primero / más lejanas primero).
  - Título (A‑Z).
  - Prioridad (Alta → Baja).
- El texto bajo el título te indica cuántas tareas estás viendo:  
  `X de Y tareas` o `No hay tareas todavía`.
- Botón **“Limpiar filtros”** para volver a ver todas las tareas.

### Completar, editar y eliminar tareas

- Marca una tarea como **completada** usando la casilla de verificación.  
  Al completarla verás confeti y escucharás un pequeño sonido.
- Pulsa **“Editar”** para abrir un modal donde puedes cambiar título, fecha, hora, categoría y prioridad.  
  Se aplican las mismas validaciones que al crear una tarea.
- Pulsa el botón **✕** para **eliminar** una tarea.

### Calendario

En la vista **Calendario**:

- Cada día muestra el número y los títulos de las tareas de esa fecha.
- Haz clic en un día para ver sus tareas en un **modal**.
- Usa los botones ◀ / ▶ para cambiar de mes.

### Resumen en Inicio

En la vista **Inicio**, bajo el formulario de nueva tarea, verás una tarjeta de **resumen** con:

- Total de tareas.
- Tareas completadas.
- Tareas pendientes.
- Tareas para hoy.
- Una barra de progreso que muestra el porcentaje completado.

### Modo oscuro

- Usa el botón **“Modo Oscuro”** en la cabecera para alternar entre tema claro y oscuro.
- La preferencia se guarda en `localStorage`, así que se recuerda al recargar la página.

---

## Estructura del proyecto

```text
taskflow-project/
├─ index.html      # Plantilla principal de la aplicación (vistas: Inicio, Tareas, Calendario, modales)
├─ styles.css      # Estilos personalizados (tarjetas, confeti, responsive, pequeños efectos)
├─ app.js          # Lógica de la aplicación (CRUD de tareas, filtros, calendario, resumen, modo oscuro)
├─ package.json    # (Opcional) Configuración de npm si utilizas herramientas auxiliares
└─ node_modules/   # Dependencias instaladas (si usas npm). No necesario para el uso básico
```

---

## Notas

- Todas las tareas se almacenan en **localStorage**, por lo que son locales a tu navegador/dispositivo.
- Si borras los datos del navegador o cambias de dispositivo, perderás las tareas.
- No hay backend ni autenticación: TaskFlow está pensada como una app personal ligera y rápida.


Carpeta src/api → capa de red del frontend

Carpeta src/services → lógica de negocio en backend

Carpeta src/controllers → controladores que reciben peticiones HTTP

Carpeta src/routes → define endpoints

Middleware global → captura errores y mapea códigos HTTP
