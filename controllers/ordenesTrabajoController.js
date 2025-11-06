// controllers/ordenesTrabajoController.js
const db = require('../db/index');

// ID 3 = 'En proceso' (según tu script.sql)
const ESTADO_EN_MANTENIMIENTO_ID = 3; 
// ID 1 = 'Preventivo' (Asumiremos que este es el tipo por defecto al iniciar)
const TIPO_MANTENIMIENTO_PREVENTIVO_ID = 1; 

exports.createOrdenInicioMtto = async (req, res) => {
  // Obtenemos el ID del analista desde el middleware
  const solicitanteId = req.user.userId;
  
  // Obtenemos los datos del frontend
  const { maquinariaId, descripcionFalla, fechaInicio } = req.body;

  if (!maquinariaId || !solicitanteId || !fechaInicio) {
    return res.status(400).json({ message: 'Faltan datos requeridos (maquinariaId, solicitanteId, fechaInicio).' });
  }
  
  const client = await db.pool.connect(); // Usamos 'pool' si está exportado, o db directamente

  try {
    // Iniciamos una transacción
    await client.query('BEGIN');

    // 1. Insertar la nueva Orden de Trabajo
    const otQuery = `
      INSERT INTO OrdenesTrabajo 
        (maquinaria_id, tipo_mtto_id, solicitante_id, fecha_creacion, descripcion_falla, estado_ot)
      VALUES 
        ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const otValues = [
      maquinariaId,
      TIPO_MANTENIMIENTO_PREVENTIVO_ID,
      solicitanteId,
      fechaInicio,
      descripcionFalla,
      ESTADO_EN_MANTENIMIENTO_ID
    ];
    const newOT = await client.query(otQuery, otValues);

    // 2. Actualizar el estado de la Maquinaria a "En Mantenimiento"
    const maquinaQuery = `
      UPDATE Maquinaria
      SET estado_actual = $1
      WHERE maquinaria_id = $2
    `;
    await client.query(maquinaQuery, [ESTADO_EN_MANTENIMIENTO_ID, maquinariaId]);

    // Si todo fue bien, confirmamos la transacción
    await client.query('COMMIT');
    
    res.status(201).json(newOT.rows[0]);

  } catch (error) {
    // Si algo falla, revertimos todo
    await client.query('ROLLBACK');
    console.error('Error en la transacción de inicio de Mtto:', error);
    res.status(500).json({ message: 'Error interno del servidor al crear la OT', error: error.message });
  } finally {
    // Liberamos el cliente de la pool
    client.release();
  }
};