const express = require('express');
const cors = require('cors');
const { port } = require('./config/env');
const taskRoutes = require('./routes/task.routes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Montamos el enrutador
app.use('/api/v1/tasks', taskRoutes);

app.get('/', (req, res) => {
    res.send('Servidor funcionando correctamente');
});

app.listen(port, () => {
    console.log(`Servidor escuchando en puerto ${port}`);
});