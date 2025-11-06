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
app.use('/api/ordenes', ordenesTrabajoRoutes);

let horometerNotifications = [];

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

    const { rows } = await db.query(
      `SELECT maquinaria_id, nombre_equipo, horometro_actual, 
              horometro_ultimo_mtto, horometro_prox_mtto 
       FROM maquinaria 
       WHERE estado_actual = $1`, // Solo de máquinas activas
      [idEstadoActivo]
    );

    const newNotifications = [];

    for (const maq of rows) {
      const horasDesdeMtto = maq.horometro_actual - maq.horometro_ultimo_mtto;
      const estado = maq.horometro_prox_mtto - horasDesdeMtto;

      let notificacion = null;

      if (estado <= 4) {
        // Lógica de "Por favor realizar mantenimiento"
        notificacion = {
          id: `not-maq-${maq.maquinaria_id}`,
          tipo: 'alerta',
          titulo: 'Mantenimiento Urgente',
          mensaje: `¡Mantenimiento requerido YA! para ${maq.nombre_equipo}. Horas restantes: ${estado.toFixed(2)}`,
          fecha: new Date().toISOString(),
          leida: false,
          enlace: '/machinery', // O podrías poner un enlace a la máquina específica
        };
      } else if (estado >= 5 && estado <= 8) {
        // Lógica de "Proximo mantenimiento"
        notificacion = {
          id: `not-maq-${maq.maquinaria_id}`,
          tipo: 'warning',
          titulo: 'Mantenimiento Próximo',
          mensaje: `${maq.nombre_equipo} requiere mantenimiento pronto. Horas restantes: ${estado.toFixed(2)}`,
          fecha: new Date().toISOString(),
          leida: false,
          enlace: '/machinery',
        };
      }
      
      if (notificacion) {
        newNotifications.push(notificacion);
      }
    }
    
    // Actualizamos la lista global
    horometerNotifications = newNotifications;

  } catch (error) {
    console.error('Error actualizando horómetros:', error);
  }
});

app.get('/api/notificaciones/horometro', (req, res) => {
  res.json(horometerNotifications);
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});