const db = require("../db/index");
const ESTADO_EN_MANTENIMIENTO_ID = 3;
const TIPO_MANTENIMIENTO_PREVENTIVO_ID = 1;
const PRIORIDAD_MEDIA_ID = 3;

exports.createOrdenInicioMtto = async (req, res) => {
  const solicitanteId = req.user.userId;
  const { maquinariaId, descripcionFalla, fechaInicio, horometroIngreso} = req.body;
  if (!maquinariaId || !solicitanteId || !fechaInicio || horometroIngreso === undefined) {
    return res.status(400).json({ message: "Faltan datos requeridos." });
  }

  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");

    const otQuery = `
      INSERT INTO OrdenesTrabajo 
        (maquinaria_id, tipo_mtto_id, solicitante_id, fecha_creacion, descripcion_falla, estado_ot, horometro_ingreso, prioridad_ot)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8)
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
      horometroIngreso,
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

exports.exportarReporteExcel = async (req, res) => {
  try {
    const query = `
      SELECT 
        u.nombre_completo AS "Analista",
        u.usuario_id AS "AnalistaID",
        m.codigo_activo AS "ID Unidad",
        m.nombre_equipo AS "Equipo",
        
        -- Formato de fechas y horas
        to_char(ot.fecha_creacion, 'YYYY-MM-DD') AS "Fecha Ingreso",
        to_char(ot.fecha_creacion, 'HH24:MI:SS') AS "Hora Inicio",
        to_char(ot.fecha_cierre, 'YYYY-MM-DD') AS "Fecha Salida",
        to_char(ot.fecha_cierre, 'HH24:MI:SS') AS "Hora Fin",
        
        -- Horómetros
        ot.horometro_ingreso AS "Horómetro Ingreso",
        ot.horometro_salida AS "Horómetro Salida",
        
        -- Tiempo restante (Cálculo actual de la máquina)
        (m.horometro_prox_mtto - m.horometro_actual) AS "Tiempo Restante Mtto"
        
      FROM OrdenesTrabajo ot
      JOIN Usuarios u ON ot.solicitante_id = u.usuario_id
      JOIN Maquinaria m ON ot.maquinaria_id = m.maquinaria_id
      ORDER BY ot.fecha_creacion DESC;
    `;
    
    const { rows } = await db.query(query);

    const conteoPorAnalista = {};
    rows.forEach(row => {
      const nombre = row['Analista'];
      conteoPorAnalista[nombre] = (conteoPorAnalista[nombre] || 0) + 1;
    });

    let csvContent = "Analista,Total Mantenimientos,ID Unidad,Equipo,Fecha Ingreso,Hora Inicio,Fecha Salida,Hora Fin,Horometro Ingreso,Horometro Salida,Tiempo Restante Mtto\n";

    rows.forEach(row => {
      const totalDelAnalista = conteoPorAnalista[row['Analista']];
      
      const fila = [
        `"${row['Analista']}"`,
        totalDelAnalista,      
        `"${row['ID Unidad']}"`,
        `"${row['Equipo']}"`,
        row['Fecha Ingreso'],
        row['Hora Inicio'],
        row['Fecha Salida'] || "En Progreso",
        row['Hora Fin'] || "-",
        row['Horómetro Ingreso'] || 0,
        row['Horómetro Salida'] || 0,
        parseFloat(row['Tiempo Restante Mtto']).toFixed(2)
      ].join(","); 
      
      csvContent += fila + "\n";
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('reporte_mantenimiento.csv'); 
    res.send(csvContent);

  } catch (error) {
    console.error('Error generando reporte Excel:', error);
    res.status(500).send('Error generando el reporte');
  }
};
