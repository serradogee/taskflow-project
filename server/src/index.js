// src/index.js
const express = require('express');
const cors = require('cors');
const { PORT } = require('./config/env');
const taskRoutes = require('./routes/task.routes');
const path = require('path');

const app = express();
const rootPath = path.resolve(__dirname, '../../');

// Middlewares
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend
app.use(express.static(rootPath));

// Logger simple
app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
});

// Rutas
app.use('/post/api/v1/tasks', taskRoutes);


// Middleware global de errores
app.use((err, req, res, next) => {
    if (err.message === 'NOT_FOUND') {
        return res.status(404).json({ error: 'Recurso no encontrado' });
    }

    if (err.message === 'INVALID_DATA') {
        return res.status(400).json({ error: 'Datos inválidos' });
    }

    console.error(err); // Esto ayuda a debug
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Arrancar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});