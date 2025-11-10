const db = require("../db/index");
const ESTADO_EN_MANTENIMIENTO_ID = 3;
const TIPO_MANTENIMIENTO_PREVENTIVO_ID = 1;
const PRIORIDAD_MEDIA_ID = 3;

exports.createOrdenInicioMtto = async (req, res) => {
  const solicitanteId = req.user.userId;
  const { maquinariaId, descripcionFalla, fechaInicio } = req.body;

  if (!maquinariaId || !solicitanteId || !fechaInicio) {
    return res.status(400).json({ message: "Faltan datos requeridos." });
  }

  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");

    const otQuery = `
      INSERT INTO OrdenesTrabajo 
        (maquinaria_id, tipo_mtto_id, solicitante_id, fecha_creacion, descripcion_falla, estado_ot, prioridad_ot)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const otValues = [
      maquinariaId,
      TIPO_MANTENIMIENTO_PREVENTIVO_ID,
      solicitanteId,
      fechaInicio,
      descripcionFalla,
      ESTADO_EN_MANTENIMIENTO_ID,
      PRIORIDAD_MEDIA_ID,
    ];
    const newOT = await client.query(otQuery, otValues);
    const maquinaQuery = `
      UPDATE Maquinaria
      SET estado_actual = $1
      WHERE maquinaria_id = $2
    `;
    await client.query(maquinaQuery, [
      ESTADO_EN_MANTENIMIENTO_ID,
      maquinariaId,
    ]);

    await client.query("COMMIT");

    res.status(201).json(newOT.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error en la transacción de inicio de Mtto:", error);
    res.status(500).json({
      message: "Error interno del servidor al crear la OT",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

exports.getAllOrdenesTrabajo = async (req, res) => {
  try {
    const query = `
      SELECT 
        ot.ot_id AS id,
        maq.nombre_equipo AS "maquinariaNombre",
        tm.nombre AS tipo,
        ot.descripcion_falla AS "descripcionProblema",
        est.estado AS estado,
        
        -- ¡Aquí leemos la prioridad real de la BD!
        COALESCE(p.nivel_prioridad, 'Sin prioridad') AS prioridad, 
        
        ot.fecha_creacion AS "fechaCreacion"
      FROM 
        OrdenesTrabajo ot
      JOIN 
        Maquinaria maq ON ot.maquinaria_id = maq.maquinaria_id
      JOIN 
        estado est ON ot.estado_ot = est.id_estado
      JOIN
        TiposMantenimiento tm ON ot.tipo_mtto_id = tm.tipo_mtto_id
      
      -- Hacemos LEFT JOIN por si alguna OT no tuviera prioridad asignada
      LEFT JOIN
        prioridad p ON ot.prioridad_ot = p.id_prioridad
        
      ORDER BY
        ot.fecha_creacion DESC;
    `;

    const { rows } = await db.query(query);
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener órdenes de trabajo:", error);
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};
