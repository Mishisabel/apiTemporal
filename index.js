// index.js
require('dotenv').config(); // Carga las variables de .env
const express = require('express');
const cors = require('cors');
const cron = require('node-cron'); 
const db = require('./db/index');

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


cron.schedule('* * * * *', async () => {
  console.log('Ejecutando tarea programada: Actualizando horómetros...');
  try {
    // 1 hora = 60 minutos. Incrementamos 1/60 de hora por cada minuto.
    const incrementoPorMinuto = 1 / 60; 
    const idEstadoActivo = 6;
  
    const query = `
      UPDATE maquinaria 
      SET 
        horometro_actual = horometro_actual + $1
      WHERE 
        estado_actual = $2;
    `;
    
    const result = await db.query(query, [incrementoPorMinuto, idEstadoActivo]);
    
    if (result.rowCount > 0) {
      console.log(`Horómetros de ${result.rowCount} máquinas activas actualizados.`);
    }

  } catch (error) {
    console.error('Error actualizando horómetros:', error);
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});