// controllers/maquinariaController.js
const db = require('../db/index');

// Obtener toda la maquinaria
exports.getAllMaquinaria = async (req, res) => {
  try {
    const { rows } = await 
    db.query('SELECT maquinaria_id, frentes.nombre_frente, frentes.analista_id, codigo_activo, nombre_equipo, modelo, '
+'fabricante, fecha_adquisicion, estado.estado as estado_actual, horometro_actual as horometro_Actual, horometro_prox_mtto as proximoMantenimiento FROM maquinaria'
+' INNER JOIN frentes ON maquinaria.frente_id = frentes.frente_id'
+' INNER JOIN estado ON maquinaria.estado_actual = estado.id_estado');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener la maquinaria', error });
  }
};

exports.getFrentesMaquinaria = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM frentes');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los frentes de maquinaria', error });
  }
};

// Obtener una maquinaria por ID
exports.getMaquinariaById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('SELECT * FROM maquinaria WHERE id_maquinaria = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Maquinaria no encontrada' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener la maquinaria', error });
  }
};

// Crear una nueva maquinaria
exports.createMaquinaria = async (req, res) => {
  const { codigo, estado_actual, fabricante, fecha_Adquisicion, frente, horometro_Actual, modelo, nombre } = req.body;
  const proximoMantenimiento= 22; // Valor por defecto
  const ultimoMantenimiento= 0; // Valor por defecto
  try {
    const { rows } = await db.query(
      'INSERT INTO maquinaria (frente_id, codigo_activo, nombre_equipo, modelo, fabricante, fecha_adquisicion, estado_actual, horometro_actual, horometro_prox_mtto, horometro_ultimo_mtto) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [frente, codigo, nombre, modelo, fabricante, fecha_Adquisicion, estado_actual, horometro_Actual, proximoMantenimiento, ultimoMantenimiento]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
     if (error.code === '23505') { // Error de constraint 'unique'
        return res.status(400).json({ message: `El número de serie '${serie}' ya existe.` });
    }
    res.status(500).json({ message: 'Error al crear la maquinaria', error });
  }
};

// Actualizar una maquinaria
exports.updateMaquinaria = async (req, res) => {
  const { id } = req.params;
  const { tipo, modelo, serie, horometro, estado } = req.body;
  try {
    const { rows } = await db.query(
      'UPDATE maquinaria SET tipo = $1, modelo = $2, serie = $3, horometro = $4, estado = $5 WHERE id_maquinaria = $6 RETURNING *',
      [tipo, modelo, serie, horometro, estado, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Maquinaria no encontrada' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar la maquinaria', error });
  }
};


exports.getEstadosMaquinaria = async (req, res) => {
  try {
    const { rows } = await db.query('select * from estado;');
    res.json(rows);
  } catch (error) {
    console.error('Error en getEstadosMaquinaria:', error); 
    res.status(500).json({ 
      message: 'Error al obtener los estados de la maquinaria', 
      error: error.message 
    });
  }
};

// exports.crearMaquinaria = async (req, res) => {
//   const { tipo, modelo, serie, horometro, estado } = req.body;
//   try {
//     const { rows } = await db.query(
//       'INSERT INTO maquinaria (tipo, modelo, serie, horometro, estado) VALUES ($1, $2, $3, $4, $5) RETURNING *',
//       [tipo, modelo, serie, horometro, estado]
//     );
//     res.status(201).json(rows[0]);
//   }
//   catch (error) {
//     if (error.code === '23505') { // Error de constraint 'unique'
//         return res.status(400).json({ message: `El número de serie '${serie}' ya existe.` });
//     }
//     res.status(500).json({ message: 'Error al crear la maquinaria', error });
//   }
// };

// Eliminar una maquinaria
exports.deleteMaquinaria = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM maquinaria WHERE id_maquinaria = $1', [id]);
    // rowCount indica cuántas filas fueron afectadas. Si es 0, no se encontró.
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Maquinaria no encontrada' });
    }
    res.status(204).send(); // 204 No Content: éxito, pero no se devuelve nada.
  } catch (error) {
    // Manejar error de restricción de clave foránea
    if (error.code === '23503') {
        return res.status(400).json({ message: 'No se puede eliminar la maquinaria porque tiene órdenes de trabajo asociadas.' });
    }
    res.status(500).json({ message: 'Error al eliminar la maquinaria', error });
  }
};