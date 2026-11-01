# Driada — Gestor de Tareas (Frontend + API Backend)

Este es un proyecto desarrollado a modo de **investigación y aprendizaje** para comprender la integración y comunicación entre un desarrollo Frontend y una API Backend. El sistema permite gestionar un flujo completo de tareas (crear, editar, listar, cambiar estados y eliminar) interactuando en tiempo real con un servidor local.

**Repositorio de este proyecto (Frontend + API):** https://github.com/bmansillaroque-hash/panel-de-control

**Repositorio del backend (aplicación de consola en Python):** https://github.com/maty2399/proyecto-integrador-gestor-de-tareas

## Stack

* **Frontend:** HTML5, CSS3, JavaScript (Vanilla ES6).
* **Backend:** Python con **FastAPI** (un framework moderno, rápido y de alto rendimiento).
* **Validación de Datos:** Pydantic (modelos de datos para las tareas).
* **Almacenamiento Local:** Archivos planos JSON (`tareas.json`) y de texto (`log.txt`) para persistir la información sin requerir bases de datos complejas.

## Estructura

* `frontend/` ➔ Contiene la interfaz de usuario basada en HTML, CSS y JavaScript.
* `api/` ➔ Aloja el archivo principal del backend (`server.py`) construido en FastAPI.
* `datos/` ➔ Carpeta que genera el servidor automáticamente, donde se guardan `tareas.json` (datos) y `log.txt` (historial de eventos/logs).

## Endpoints de la API

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| **GET** | `/api/tareas` | Obtiene la lista completa de tareas. |
| **GET** | `/api/tareas/{id}` | Obtiene los detalles de una tarea específica. |
| **POST** | `/api/tareas` | Crea una nueva tarea en el sistema. |
| **PATCH** | `/api/tareas/{id}` | Modifica campos específicos de una tarea. |
| **PATCH** | `/api/tareas/{id}/estado` | Cambia el estado de una tarea (`pendiente`, `en curso`, etc.). |
| **DELETE** | `/api/tareas/{id}` | Elimina una tarea por su ID. |
| **GET** | `/api/estadisticas` | Muestra el conteo de tareas activas, pendientes y en curso. |
| **GET** | `/api/historial` | Devuelve el historial registrado en los logs del servidor. |

## Instalación y Uso Local

Seguí estos pasos para poner en marcha el proyecto en tu equipo.

### Requisitos

* **Python 3.8+**
* **FastAPI** (framework para la API)
* **Uvicorn** (servidor para ejecutar la API)

### 1. Clonar el repositorio
```bash
git clone https://github.com/bmansillaroque-hash/panel-de-control.git
cd panel-de-control
```

### 2. Instalar las dependencias
```bash
pip install fastapi uvicorn
```

### 3. Iniciar el servidor de la API
Ejecutá el servidor Uvicorn apuntando al archivo `server.py` que está dentro de la carpeta `api`:
```bash
uvicorn api.server:app --reload --port 8002
```

### 4. Abrir la aplicación
Con el servidor corriendo, abrí el navegador y entrá a:
👉 **http://127.0.0.1:8002**

## Créditos de Uso de IA

Para este proyecto usamos inteligencia artificial como apoyo, siguiendo las pautas de la cátedra sobre su uso responsable. Nos ayudó a mejorar la API y a entender mejor cómo se conectan el frontend y el backend. Todo el código fue revisado, probado y adaptado por nosotros.

**Herramienta usada:** [claude.ia]
