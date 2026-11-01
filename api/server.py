# ============================================
# API WEB DEL GESTOR DE TAREAS — DRIADA
# ============================================

import json
import os
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel


# ============================================
# RUTAS DE ARCHIVOS
# ============================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "datos")
TASKS_FILE = os.path.join(DATA_DIR, "tareas.json")
LOG_FILE = os.path.join(DATA_DIR, "log.txt")
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")


# ============================================
# CREAR LA API
# ============================================

app = FastAPI(
    title="Driada — API Gestor de Tareas",
    version="1.0.0"
)


# ============================================
# CORS: PERMITE QUE EL FRONTEND HABLE CON LA API
# ============================================

allowed_origins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://127.0.0.1:8000",
    "http://localhost:8000",
    "http://127.0.0.1:8001",
    "http://localhost:8001",
    "http://127.0.0.1:8002",
    "http://localhost:8002"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type"]
)


# ============================================
# MODELOS: CÓMO ES UNA TAREA
# ============================================

class Task(BaseModel):
    title: str
    priority: str
    category: str
    assignee: str
    deadline: str
    status: str = "pendiente"


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    assignee: Optional[str] = None
    deadline: Optional[str] = None
    status: Optional[str] = None


class StatusUpdate(BaseModel):
    status: str


# ============================================
# FUNCIONES PARA LEER Y GUARDAR DATOS
# ============================================

def load_tasks():
    """Lee las tareas desde datos/tareas.json"""

    if not os.path.exists(TASKS_FILE):
        return []

    with open(TASKS_FILE, "r", encoding="utf-8") as file:
        content = file.read().strip()

    return json.loads(content) if content else []


def save_tasks(tasks):
    """Guarda las tareas en datos/tareas.json"""

    os.makedirs(DATA_DIR, exist_ok=True)

    with open(TASKS_FILE, "w", encoding="utf-8") as file:
        json.dump(tasks, file, ensure_ascii=False, indent=2)


def write_log(message):
    """Guarda un evento en datos/log.txt"""

    os.makedirs(DATA_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%d/%m/%Y %H:%M:%S")

    with open(LOG_FILE, "a", encoding="utf-8") as file:
        file.write(f"[{timestamp}] {message}\n")


def get_next_id(tasks):
    """Calcula el próximo ID disponible"""

    if not tasks:
        return 1

    return max(task["id"] for task in tasks) + 1


# ============================================
# ENDPOINTS
# ============================================

# Traer todas las tareas
@app.get("/api/tareas")
def get_tasks():
    return load_tasks()


# Traer una tarea por ID
@app.get("/api/tareas/{task_id}")
def get_task(task_id: int):
    tasks = load_tasks()

    for task in tasks:
        if task["id"] == task_id:
            return task

    raise HTTPException(status_code=404, detail="Tarea no encontrada")


# Crear una tarea
@app.post("/api/tareas", status_code=201)
def create_task(task: Task):
    tasks = load_tasks()

    new_task = {
        "id": get_next_id(tasks),
        **task.model_dump()
    }

    tasks.append(new_task)
    save_tasks(tasks)

    write_log(f"Tarea creada: #{new_task['id']} - {new_task['title']}")

    return new_task


# Editar una tarea
@app.patch("/api/tareas/{task_id}")
def update_task(task_id: int, changes: TaskUpdate):
    tasks = load_tasks()

    for task in tasks:
        if task["id"] == task_id:
            updated_data = changes.model_dump(exclude_unset=True)

            if not updated_data:
                raise HTTPException(status_code=400, detail="No hay cambios")

            task.update(updated_data)
            save_tasks(tasks)

            write_log(f"Tarea #{task_id} editada.")
            return task

    raise HTTPException(status_code=404, detail="Tarea no encontrada")


# Cambiar el estado de una tarea
@app.patch("/api/tareas/{task_id}/estado")
def change_status(task_id: int, changes: StatusUpdate):
    tasks = load_tasks()

    for task in tasks:
        if task["id"] == task_id:
            task["status"] = changes.status
            save_tasks(tasks)

            write_log(f"Estado cambiado: #{task_id} -> {changes.status}")
            return task

    raise HTTPException(status_code=404, detail="Tarea no encontrada")


# Eliminar una tarea
@app.delete("/api/tareas/{task_id}")
def delete_task(task_id: int):
    tasks = load_tasks()
    filtered_tasks = [task for task in tasks if task["id"] != task_id]

    if len(filtered_tasks) == len(tasks):
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    save_tasks(filtered_tasks)
    write_log(f"Tarea #{task_id} eliminada.")

    return {"message": f"Tarea {task_id} eliminada"}


# Estadísticas
@app.get("/api/estadisticas")
def get_stats():
    tasks = load_tasks()

    return {
        "activas": len(tasks),
        "pendientes": len([
            task for task in tasks
            if task.get("status") == "pendiente"
        ]),
        "en_curso": len([
            task for task in tasks
            if task.get("status") == "en curso"
        ])
    }


# Historial
@app.get("/api/historial")
def get_history():
    if not os.path.exists(LOG_FILE):
        return {"historial": []}

    with open(LOG_FILE, "r", encoding="utf-8") as file:
        lines = file.readlines()

    return {
        "historial": [line.strip() for line in lines]
    }


# ============================================
# MOSTRAR EL FRONTEND
# ============================================

# Esta parte hace que al entrar a http://127.0.0.1:8002
# se abra tu frontend/index.html
app.mount(
    "/",
    StaticFiles(directory=FRONTEND_DIR, html=True),
    name="frontend"
)