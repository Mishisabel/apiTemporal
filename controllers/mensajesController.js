// controllers/mensajesController.js
const db = require('../db/index');

// Función para guardar un nuevo mensaje
exports.guardarMensaje = async (datos) => {
  const { remitente_id, destinatario_id, cuerpo } = datos;
  try {
    const query = `
      INSERT INTO Mensajes (remitente_id, destinatario_id, cuerpo)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const { rows } = await db.query(query, [remitente_id, destinatario_id, cuerpo]);
    return rows[0];
  } catch (error) {
    console.error("Error al guardar mensaje en BD:", error);
  }
};

// Función para obtener el historial entre dos usuarios
exports.getHistorialChat = async (req, res) => {
  const miId = req.user.userId; // Viene del authMiddleware
  const otroUsuarioId = req.params.id; // Viene de la URL

  try {
    const query = `
      SELECT * FROM Mensajes
      WHERE 
        (remitente_id = $1 AND destinatario_id = $2) 
      OR 
        (remitente_id = $2 AND destinatario_id = $1)
      ORDER BY
        fecha_envio ASC;
    `;
    const { rows } = await db.query(query, [miId, otroUsuarioId]);
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener historial:", error);
    res.status(500).json({ message: "Error al obtener historial del chat" });
  }
};