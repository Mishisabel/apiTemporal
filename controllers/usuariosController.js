// controllers/usuariosController.js
const db = require('../db/index');

exports.getAllUsuarios = async (req, res) => {
  const miId = req.user.userId; // Obtenemos el ID del usuario que hace la petición

  try {
    // Traemos a todos los usuarios EXCEPTO a nosotros mismos
    const query = `
      SELECT 
        usuario_id AS id, 
        nombre_completo AS nombre, 
        rol.nombre_rol AS rol
      FROM 
        Usuarios
      JOIN
        Roles rol ON Usuarios.rol_id = rol.rol_id
      WHERE 
        usuario_id != $1
      ORDER BY
        nombre_completo ASC;
    `;
    const { rows } = await db.query(query, [miId]);
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ message: "Error al obtener lista de usuarios" });
  }
};