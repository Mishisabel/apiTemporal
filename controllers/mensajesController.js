const db = require('../db/index');

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

exports.getHistorialChat = async (req, res) => {
  const miId = req.user.userId;
  const otroUsuarioId = req.params.id;

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

exports.markMessagesAsRead = async (remitente_id, destinatario_id) => {
  try {
    const query = `
      UPDATE Mensajes 
      SET leido = TRUE 
      WHERE 
        remitente_id = $1 
        AND destinatario_id = $2 
        AND leido = FALSE
      RETURNING remitente_id, destinatario_id;
    `;
    const { rows } = await db.query(query, [remitente_id, destinatario_id]);
    if (rows.length > 0) {
      return rows[0];
    }
    return null;
  } catch (error) {
    console.error("Error al marcar mensajes como leídos:", error);
  }

};