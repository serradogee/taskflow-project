# TaskFlow Backend - API REST

Este es el backend de **TaskFlow**, una API REST robusta construida con **Node.js** y **Express**. La aplicación está diseñada siguiendo principios de arquitectura limpia y separación de responsabilidades para facilitar el mantenimiento y la escalabilidad.

## 1. Descripción de la API

La API permite gestionar tareas (pendientes, completadas, prioridades, etc.) mediante operaciones CRUD estándar. Está optimizada para responder en formato JSON y maneja estados de red, validaciones y errores de forma centralizada.

## 2. Arquitectura por Capas

El servidor utiliza una **arquitectura en 3 capas** para desacoplar la lógica de transporte (HTTP) de la lógica de negocio y los datos:

*   **Routes (`/src/routes`)**: Define los puntos de entrada (endpoints) y asocia los métodos HTTP (GET, POST, etc.) con sus respectivos controladores. Es la capa de definición de la interfaz.
*   **Controllers (`/src/controllers`)**: Actúa como pegamento entre la petición HTTP y el servicio. Extrae los datos de `req.body` o `req.params`, llama al servicio correspondiente y envía la respuesta (`res.json`). No contiene lógica de negocio pesada.
*   **Services (`/src/services`)**: Contiene la **lógica de negocio real** y la manipulación de datos. Es agnóstico a Express; si cambiáramos de framework web, esta capa permanecería intacta. Aquí se realizan las validaciones y el almacenamiento.

## 3. Middlewares

El flujo de cada petición atraviesa varios middlewares pre-configurados:

1.  **CORS**: Habilita peticiones desde diferentes dominios (útil para el frontend en desarrollo).
2.  **Express JSON**: Parsea automáticamente el cuerpo de las peticiones (`body`) a objetos JavaScript.
3.  **Static**: Sirve los archivos estáticos del frontend directamente desde la raíz si es necesario.
4.  **Logger**: Un middleware simple en `index.js` que registra cada método y URL en la consola para facilitar el debugging.
5.  **Global Error Handler**: Captura cualquier error lanzado en las capas inferiores y devuelve una respuesta JSON estandarizada con el código HTTP correcto.

## 4. Flujo de una Petición

El camino que sigue una solicitud es:
`Cliente HTTP` → `Middleware JSON/CORS` → `Router (match URL)` → `Controller` → `Service (lógica/validación)` → `Response (JSON)`

Si ocurre un error en cualquier punto:
`Error` → `next(err)` → `Global Error Handler` → `Response (JSON error)`

## 5. Manejo de Errores

Se utiliza un sistema de errores basado en mensajes clave para determinar el código de estado:

*   **400 (Bad Request)**: Lanzado cuando los datos de entrada son inválidos (mínimo título requerido). Mensaje: `INVALID_DATA`.
*   **404 (Not Found)**: Lanzado cuando se intenta acceder a una tarea que no existe por su ID. Mensaje: `NOT_FOUND`.
*   **500 (Internal Server Error)**: Error genérico para fallos inesperados o excepciones no controladas.

## 6. Validación de Datos

La validación se realiza en la capa de **Services**. Antes de persistir una tarea, se verifica que:
- El `title` esté presente y sea un `string`.
- Los IDs sean tratados como números válidos.

## 7. Variables de Entorno (.env)

El proyecto utiliza `dotenv` para configuraciones sensibles.
Archivo `.env` requerido:
```env
PORT=3000
```
La configuración se centraliza en `src/config/env.js` para evitar el uso de `process.env` disperso por todo el código.

## 8. Endpoints de la API

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| **GET** | `/post/api/v1/tasks` | Obtiene el listado completo de tareas. |
| **POST** | `/post/api/v1/tasks` | Crea una nueva tarea. |
| **PUT** | `/post/api/v1/tasks/:id` | Actualiza una tarea existente. |
| **DELETE** | `/post/api/v1/tasks/:id` | Elimina una tarea por su ID. |

## 9. Ejemplos de Request/Response

### Crear Tarea (POST)
**Request Body:**
```json
{
  "title": "Aprender Node.js",
  "priority": "Alta",
  "category": "Estudios"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "title": "Aprender Node.js",
  "priority": "Alta",
  "category": "Estudios",
  "completed": false
}
```

### Obtener Tareas (GET)
**Response (200 OK):**
```json
[
  {
    "id": 1,
    "title": "Aprender Node.js",
    "completed": false
  }
]
```

## 10. Decisiones Técnicas

*   **Separación en capas**: Se decidió separar servicios de controladores para permitir testabilidad unitaria. Los servicios pueden probarse sin necesidad de simular objetos `req` y `res` de Express.
*   **Middleware de Error Centralizado**: En lugar de usar `try/catch` con `res.status` en cada endpoint, centralizamos los errores. Esto garantiza que la API siempre devuelva el mismo formato de error al cliente, mejorando la previsibilidad.
*   **In-Memory Storage**: Actualmente los datos se guardan en un array volátil para simplicidad, pero gracias a la arquitectura de servicios, conectar una base de datos requiere cambios mínimos en un solo archivo.
