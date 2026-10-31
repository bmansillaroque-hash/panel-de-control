// ==============================
// CONFIGURACIÓN
// ==============================

// Cambiar a true cuando la API esté lista
const USE_API = false;

// URL futura de la API
const API_URL = "http://127.0.0.1:8000/api";

const STORAGE_KEY = "driada-tasks";
const LOG_KEY = "driada-logs";


// ==============================
// ESTADO INICIAL
// ==============================

let tasks = [];
let completedTasks = [];
let logs = [];


// ==============================
// UTILIDADES
// ==============================

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

function formatDateOnly(value) {
  if (!value) return "Sin fecha";

  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function addLog(message) {
  logs.unshift(`${formatDate(new Date())} — ${message}`);
  saveLogs();
  renderLogs();
}

function scrollToSection(id) {
  const section = document.getElementById(id);
  if (section) {
    section.scrollIntoView({ behavior: "smooth" });
  }
}


// ==============================
// PERSISTENCIA LOCAL
// ==============================

function loadData() {
  const savedTasks = localStorage.getItem(STORAGE_KEY);
  const savedLogs = localStorage.getItem(LOG_KEY);

  if (savedTasks) {
    const data = JSON.parse(savedTasks);
    tasks = data.active || [];
    completedTasks = data.completed || [];
  } else {
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

function saveData() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      active: tasks,
      completed: completedTasks
    })
  );
}

function saveLogs() {
  localStorage.setItem(LOG_KEY, JSON.stringify(logs));
}

function getNextId() {
  const allIds = [
    ...tasks.map(task => task.id),
    ...completedTasks.map(task => task.id)
  ];

  return allIds.length ? Math.max(...allIds) + 1 : 1;
}


// ==============================
// RENDERIZADO
// ==============================

function render() {
  renderTasks();
  renderCompleted();
  renderStats();
  renderLogs();
}

function renderTasks() {
  const taskList = document.getElementById("task-list");

  if (tasks.length === 0) {
    taskList.innerHTML = `
      <p class="empty-message">No hay tareas activas por ahora.</p>
    `;
    return;
  }

  taskList.innerHTML = tasks.map(task => {
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

function renderStats() {
  document.getElementById("stat-active").textContent = tasks.length;
  document.getElementById("stat-progress").textContent =
    tasks.filter(task => task.status === "en curso").length;
  document.getElementById("stat-done").textContent = completedTasks.length;
}

function renderLogs() {
  const logContainer = document.getElementById("log-container");

  logContainer.innerHTML = logs
    .map(log => `<p class="log-line">${escapeHtml(log)}</p>`)
    .join("");
}


// ==============================
// ACCIONES
// ==============================

function handleAddTask(event) {
  event.preventDefault();

  const editingId = document.getElementById("task-form").dataset.editingId;

  const taskData = {
    title: document.getElementById("task-title").value.trim(),
    priority: document.getElementById("task-priority").value,
    category: document.getElementById("task-category").value.trim(),
    assignee: document.getElementById("task-assignee").value.trim(),
    deadline: document.getElementById("task-deadline").value,
    status: document.getElementById("task-status").value
  };

  if (editingId) {
    const task = tasks.find(item => item.id === Number(editingId));

    if (task) {
      Object.assign(task, taskData);
      addLog(`Tarea #${task.id} editada: "${task.title}".`);
    }

    delete document.getElementById("task-form").dataset.editingId;
    document.querySelector('#task-form button[type="submit"]').textContent =
      "Guardar tarea";
  } else {
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
  form.dataset.editingId = id;

  document.querySelector('#task-form button[type="submit"]').textContent =
    "Actualizar tarea";

  scrollToSection("nueva-tarea");
}

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

function changeStatus(id, newStatus) {
  const task = tasks.find(item => item.id === id);

  if (!task) return;

  if (newStatus === "finalizada") {
    completeTask(id);
    return;
  }

  task.status = newStatus;

  addLog(`Estado cambiado: #${id} → ${newStatus}.`);
  saveData();
  render();
}

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

function restoreTask(id) {
  const index = completedTasks.findIndex(task => task.id === id);

  if (index === -1) return;

  const task = completedTasks[index];

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

function escapeCsv(value) {
  const text = String(value ?? "");

  if (text.includes(";") || text.includes('"') || text.includes("\n")) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function exportCsv() {
  const headers = [
    "ID",
    "Titulo",
    "Prioridad",
    "Categoria",
    "Responsable",
    "Fecha limite",
    "Estado"
  ];

  const activeRows = tasks.map(task => [
    task.id,
    task.title,
    task.priority,
    task.category,
    task.assignee,
    formatDateOnly(task.deadline),
    task.status
  ]);

  const completedRows = completedTasks.map(task => [
    task.id,
    task.title,
    "",
    "",
    task.assignee,
    "",
    "finalizada"
  ]);

  const csvContent = [
    headers,
    ...activeRows,
    ...completedRows
  ]
    .map(row => row.map(escapeCsv).join(";"))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;"
  });

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

function setDefaultDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  document.getElementById("task-deadline").value = `${year}-${month}-${day}`;
}

document.getElementById("task-form")
  .addEventListener("submit", handleAddTask);

loadData();
setDefaultDate();
render();
