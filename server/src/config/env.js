// src/config/env.js
require('dotenv').config(); // Carga .env

// No lanzar error si falta PORT en Vercel (ellos lo gestionan)
const portValue = process.env.PORT || 3000;

module.exports = {
    PORT: portValue
};