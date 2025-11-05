// index.js
require('dotenv').config(); // Carga las variables de .env
const express = require('express');
const cors = require('cors');

const app = express();

// --- Middlewares ---
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Private-Network', 'true');
  next();
});
app.use(cors());
app.use(express.json()); 

const usuariosRoutes = require('./routes/usuarios');
const maquinariaRoutes = require('./routes/maquinaria');

// Prefijo para todas las rutas de la API
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/maquinaria', maquinariaRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});