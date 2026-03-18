// src/config/env.js
require('dotenv').config(); // Carga .env

if (!process.env.PORT) {
    throw new Error('El puerto no está definido');
}

module.exports = {
    PORT: process.env.PORT
};