// ==============================
// CONFIGURACIÓN
// ==============================

// MODO LOCAL vs MODO API
// false = modo local: los datos se guardan en el navegador (localStorage)
// true  = modo API: los datos se guardan en el servidor (base de datos)
// GUÍA: cuando la API esté lista, cambiar esto a true
const USE_API = false;

// Dirección de la API
// GUÍA: ahora apunta a mi compu (127.0.0.1 = localhost, puerto 8000).
// Cuando suba el backend a un servidor, reemplazar por la URL real, por ejemplo:
// const API_URL = "https://mi-backend.onrender.com/api";
// (si el sitio queda en https, la API también tiene que ser https)
// (y el backend tiene que tener CORS activado para aceptar pedidos de este front)
const API_URL = "http://127.0.0.1:8000/api";

// Nombres con los que guardo cosas en localStorage (solo se usan en modo local)
const STORAGE_KEY = "driada-tasks";
const LOG_KEY = "driada-logs";


// ==============================
// ESTADO INICIAL
// ==============================

// acá guardo todo mientras la página está abierta
let tasks = [];          // tareas activas
let completedTasks = []; // tareas finalizadas
let logs = [];           // historial de eventos


// ==============================
// UTILIDADES
// ==============================

// Arma la fecha y hora completa, ej: 26/10/2026 18:30:00
function formatDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

// Pasa una fecha de 2026-11-10 a 10/11/2026
function formatDateOnly(value) {
  if (!value) return "Sin fecha";

  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

// Cambia los caracteres raros (< > & etc.) para que nadie pueda meter código en los textos
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Agrega una línea nueva al historial (arriba de todo)
function addLog(message) {
  logs.unshift(`${formatDate(new Date())} — ${message}`);
  saveLogs();
  renderLogs();
}

// Baja suavemente hasta la sección que tenga ese id
function scrollToSection(id) {
  const section = document.getElementById(id);
  if (section) {
    section.scrollIntoView({ behavior: "smooth" });
  }
}


// ==============================
// PERSISTENCIA LOCAL
// ==============================

// Carga los datos al abrir la página
// GUÍA API: acá es donde, en vez de leer de localStorage, habría que pedir los datos a la API.
// Ejemplo (hay que volver la función async y llamarla con await al final del archivo):
//
// if (USE_API) {
//   const resTasks = await fetch(`${API_URL}/tasks`);          // GET /api/tasks
//   const dataTasks = await resTasks.json();
//   tasks = dataTasks.active || [];
//   completedTasks = dataTasks.completed || [];
//
//   const resLogs = await fetch(`${API_URL}/logs`);            // GET /api/logs
//   logs = await resLogs.json();
//   return; // salgo para que no siga con el localStorage
// }
function loadData() {
  const savedTasks = localStorage.getItem(STORAGE_KEY);
  const savedLogs = localStorage.getItem(LOG_KEY);

  if (savedTasks) {
    const data = JSON.parse(savedTasks);
    tasks = data.active || [];
    completedTasks = data.completed || [];
  } else {
    // si es la primera vez, cargo tareas de ejemplo
    tasks = [
      {
        id: 1,
        title: "Diseñar landing de Driada",
        priority: "Alta",
        category: "Diseño",
        assignee: "Rocío",
        deadline: "2026-11-10",
        status: "pendiente"
      },
      {
        id: 2,
        title: "Preparar base de datos",
        priority: "Media",
        category: "Desarrollo",
        assignee: "Matías",
        deadline: "2026-11-12",
        status: "en curso"
      }
    ];

    completedTasks = [
      {
        id: 0,
        title: "Configurar entorno Linux",
        assignee: "Rocío",
        finishedAt: "26/10/2026 18:30:00"
      }
    ];

    saveData();
  }

  if (savedLogs) {
    logs = JSON.parse(savedLogs);
  } else {
    logs = [`${formatDate(new Date())} — Programa inicializado.`];
    saveLogs();
  }
}

// Guarda las tareas en el navegador
// GUÍA API: con la API ya no hace falta guardar todo junto.
// Se manda cada cambio por separado desde las funciones de ACCIONES (más abajo):
// crear -> POST, editar -> PUT, eliminar -> DELETE.
function saveData() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      active: tasks,
      completed: completedTasks
    })
  );
}

// Guarda el historial en el navegador
// GUÍA API: el historial lo podría guardar el backend (POST /api/logs)
function saveLogs() {
  localStorage.setItem(LOG_KEY, JSON.stringify(logs));
}

// Busca el id más alto y le suma 1 para la tarea nueva
// GUÍA API: con base de datos, el id lo genera la base sola (autoincrement),
// así que esta función ya no se usaría y no hay que mandar el id al crear.
function getNextId() {
  const allIds = [
    ...tasks.map(task => task.id),
    ...completedTasks.map(task => task.id)
  ];

  return allIds.length ? Math.max(...allIds) + 1 : 1;
}


// ==============================
// RENDERIZADO
// (dibujan los datos en la pantalla)
// ==============================

// Vuelve a dibujar todo
function render() {
  renderTasks();
  renderCompleted();
  renderStats();
  renderLogs();
}

// Dibuja las tarjetas de tareas activas
function renderTasks() {
  const taskList = document.getElementById("task-list");

  // si no hay tareas muestro un mensaje
  if (tasks.length === 0) {
    taskList.innerHTML = `
      <p class="empty-message">No hay tareas activas por ahora.</p>
    `;
    return;
  }

  taskList.innerHTML = tasks.map(task => {
    // elijo la clase de color según la prioridad
    const priorityClass =
      task.priority === "Alta"
        ? "badge-alta"
        : task.priority === "Media"
          ? "badge-media"
          : "badge-baja";

    return `
      <article class="task-card">
        <div class="task-top">
          <span class="task-id">#${task.id}</span>
          <h3 class="task-title">${escapeHtml(task.title)}</h3>
          <span class="badge ${priorityClass}">
            ${escapeHtml(task.priority)}
          </span>
        </div>

        <p class="task-info">
          Responsable: <strong>${escapeHtml(task.assignee)}</strong> •
          Categoría: <strong>${escapeHtml(task.category)}</strong> •
          Límite: <strong>${formatDateOnly(task.deadline)}</strong>
        </p>

        <div class="task-actions">
          <select onchange="changeStatus(${task.id}, this.value)">
            <option value="pendiente" ${task.status === "pendiente" ? "selected" : ""}>
              Pendiente
            </option>
            <option value="en curso" ${task.status === "en curso" ? "selected" : ""}>
              En curso
            </option>
            <option value="finalizada">
              Finalizada
            </option>
          </select>

          <div class="task-buttons">
            <button
              class="btn btn-outline-dark btn-small"
              onclick="editTask(${task.id})"
            >
              Editar
            </button>

            <button
              class="btn btn-danger btn-small"
              onclick="deleteTask(${task.id})"
            >
              Eliminar
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

// Dibuja las tareas finalizadas
function renderCompleted() {
  const completedList = document.getElementById("completed-list");

  if (completedTasks.length === 0) {
    completedList.innerHTML = `
      <p class="empty-message">Todavía no hay tareas finalizadas.</p>
    `;
    return;
  }

  completedList.innerHTML = completedTasks.map(task => `
    <article class="completed-card">
      <div>
        <p class="completed-title">
          #${task.id} ${escapeHtml(task.title)}
        </p>
        <p class="completed-date">
          Responsable: ${escapeHtml(task.assignee)} •
          Finalizada: ${escapeHtml(task.finishedAt)}
        </p>
      </div>

      <button
        class="btn btn-outline-dark btn-small"
        onclick="restoreTask(${task.id})"
      >
        Restaurar
      </button>
    </article>
  `).join("");
}

// Actualiza los números de las estadísticas
function renderStats() {
  document.getElementById("stat-active").textContent = tasks.length;
  document.getElementById("stat-progress").textContent =
    tasks.filter(task => task.status === "en curso").length;
  document.getElementById("stat-done").textContent = completedTasks.length;
}

// Dibuja el historial de eventos
function renderLogs() {
  const logContainer = document.getElementById("log-container");

  logContainer.innerHTML = logs
    .map(log => `<p class="log-line">${escapeHtml(log)}</p>`)
    .join("");
}


// ==============================
// ACCIONES
// ==============================

// Se ejecuta al apretar "Guardar tarea": sirve para crear y también para editar
// GUÍA API:
//  - Si estoy editando (editingId tiene valor) -> PUT  `${API_URL}/tasks/${editingId}`
//  - Si es una tarea nueva                     -> POST `${API_URL}/tasks`
// Ejemplo para crear:
//
// if (USE_API) {
//   const res = await fetch(`${API_URL}/tasks`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(taskData)      // taskData ya tiene los datos del formulario
//   });
//   const newTask = await res.json();     // la API me devuelve la tarea con su id
//   tasks.push(newTask);
// }
function handleAddTask(event) {
  event.preventDefault(); // evita que la página se recargue

  const editingId = document.getElementById("task-form").dataset.editingId;

  // junto los datos que escribió la persona en el formulario
  const taskData = {
    title: document.getElementById("task-title").value.trim(),
    priority: document.getElementById("task-priority").value,
    category: document.getElementById("task-category").value.trim(),
    assignee: document.getElementById("task-assignee").value.trim(),
    deadline: document.getElementById("task-deadline").value,
    status: document.getElementById("task-status").value
  };

  if (editingId) {
    // estoy editando una tarea que ya existe
    const task = tasks.find(item => item.id === Number(editingId));

    if (task) {
      Object.assign(task, taskData);
      addLog(`Tarea #${task.id} editada: "${task.title}".`);
    }

    delete document.getElementById("task-form").dataset.editingId;
    document.querySelector('#task-form button[type="submit"]').textContent =
      "Guardar tarea";
  } else {
    // es una tarea nueva
    const newTask = {
      id: getNextId(),
      ...taskData
    };

    tasks.push(newTask);
    addLog(`Tarea creada: "${newTask.title}".`);
  }

  saveData();
  document.getElementById("task-form").reset();
  render();
}

// Pasa los datos de la tarea al formulario para poder editarla
// (acá no hace falta tocar nada para la API, el cambio se manda en handleAddTask)
function editTask(id) {
  const task = tasks.find(item => item.id === id);

  if (!task) return;

  document.getElementById("task-title").value = task.title;
  document.getElementById("task-priority").value = task.priority;
  document.getElementById("task-category").value = task.category;
  document.getElementById("task-assignee").value = task.assignee;
  document.getElementById("task-deadline").value = task.deadline;
  document.getElementById("task-status").value = task.status;

  const form = document.getElementById("task-form");
  form.dataset.editingId = id; // me guardo qué tarea estoy editando

  document.querySelector('#task-form button[type="submit"]').textContent =
    "Actualizar tarea";

  scrollToSection("nueva-tarea");
}

// Elimina una tarea (pide confirmación antes)
// GUÍA API: antes de sacarla de la lista, avisar al servidor:
// await fetch(`${API_URL}/tasks/${id}`, { method: "DELETE" });
function deleteTask(id) {
  const task = tasks.find(item => item.id === id);

  if (!task) return;

  const confirmed = confirm(`¿Eliminar la tarea "${task.title}"?`);

  if (!confirmed) return;

  tasks = tasks.filter(item => item.id !== id);

  addLog(`Tarea #${id} eliminada.`);
  saveData();
  render();
}

// Cambia el estado desde el select de la tarjeta
// GUÍA API: mandar solo el estado nuevo con PATCH:
// await fetch(`${API_URL}/tasks/${id}`, {
//   method: "PATCH",
//   headers: { "Content-Type": "application/json" },
//   body: JSON.stringify({ status: newStatus })
// });
function changeStatus(id, newStatus) {
  const task = tasks.find(item => item.id === id);

  if (!task) return;

  // si elige "finalizada" la paso a la otra lista
  if (newStatus === "finalizada") {
    completeTask(id);
    return;
  }

  task.status = newStatus;

  addLog(`Estado cambiado: #${id} → ${newStatus}.`);
  saveData();
  render();
}

// Pasa una tarea de activas a finalizadas
// GUÍA API: se puede avisar con PATCH `${API_URL}/tasks/${id}` y status "finalizada"
// (o un endpoint propio, tipo POST `${API_URL}/tasks/${id}/complete`)
function completeTask(id) {
  const index = tasks.findIndex(task => task.id === id);

  if (index === -1) return;

  const task = tasks[index];

  completedTasks.unshift({
    id: task.id,
    title: task.title,
    assignee: task.assignee,
    finishedAt: formatDate(new Date())
  });

  tasks.splice(index, 1);

  addLog(`Tarea #${id} finalizada.`);
  saveData();
  render();
}

// Vuelve a pasar una tarea finalizada a activas
// GUÍA API: igual que arriba, avisar al servidor (PATCH con status "pendiente"
// o un endpoint tipo POST `${API_URL}/tasks/${id}/restore`)
function restoreTask(id) {
  const index = completedTasks.findIndex(task => task.id === id);

  if (index === -1) return;

  const task = completedTasks[index];

  // como la finalizada no guarda prioridad ni categoría, le pongo valores por defecto
  tasks.push({
    id: task.id,
    title: task.title,
    priority: "Media",
    category: "General",
    assignee: task.assignee,
    deadline: "",
    status: "pendiente"
  });

  completedTasks.splice(index, 1);

  addLog(`Tarea #${id} restaurada a activas.`);
  saveData();
  render();
}


// ==============================
// EXPORTAR CSV
// ==============================

// Si el texto tiene ; o comillas o salto de línea, lo encierra entre comillas
// para que no se rompa la columna en Excel
function escapeCsv(value) {
  const text = String(value ?? "");

  if (text.includes(";") || text.includes('"') || text.includes("\n")) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

// Arma el archivo CSV y lo descarga
function exportCsv() {
  // títulos de las columnas
  const headers = [
    "ID",
    "Titulo",
    "Prioridad",
    "Categoria",
    "Responsable",
    "Fecha limite",
    "Estado"
  ];

  // filas de las tareas activas
  const activeRows = tasks.map(task => [
    task.id,
    task.title,
    task.priority,
    task.category,
    task.assignee,
    formatDateOnly(task.deadline),
    task.status
  ]);

  // filas de las finalizadas (algunos datos quedan vacíos)
  const completedRows = completedTasks.map(task => [
    task.id,
    task.title,
    "",
    "",
    task.assignee,
    "",
    "finalizada"
  ]);

  // uno todo en un solo texto: columnas separadas con ; y filas con salto de línea
  const csvContent = [
    headers,
    ...activeRows,
    ...completedRows
  ]
    .map(row => row.map(escapeCsv).join(";"))
    .join("\n");

  // el \uFEFF hace que Excel muestre bien las tildes
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;"
  });

  // creo un link invisible, le hago click y lo borro
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "reporte-tareas-driada.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);

  addLog("Reporte CSV exportado.");
}


// ==============================
// INICIO
// ==============================

// Pone la fecha de hoy por defecto en el campo "Fecha límite"
function setDefaultDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  document.getElementById("task-deadline").value = `${year}-${month}-${day}`;
}

// cuando se envía el formulario, se ejecuta handleAddTask
document.getElementById("task-form")
  .addEventListener("submit", handleAddTask);

// arranque de la página
loadData();
setDefaultDate();
render();
