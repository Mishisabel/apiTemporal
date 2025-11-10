const db = require("../db/index");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const { rol, usuario, contrasena, nombre, email } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const contrasenaHash = await bcrypt.hash(contrasena, salt);
    const result = await db.query(
      "INSERT INTO Usuarios (rol_id, nombre_usuario, password_hash, nombre_completo, email) VALUES ($1, $2, $3, $4, $5) RETURNING rol_id, nombre_usuario, password_hash, nombre_completo, email",
      [rol, usuario, contrasenaHash, nombre, email]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    if (error.code === "23505") {
      return res
        .status(400)
        .json({ message: "El correo electrónico ya está registrado." });
    }
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

exports.login = async (req, res) => {
  const { correo, contrasena } = req.body;
  try {
    const userResult = await db.query(
      "SELECT usuarios.usuario_id as id, usuarios.nombre_completo as nombre, usuarios.password_hash, usuarios.email as correo,  roles.nombre_rol as rol FROM usuarios INNER JOIN roles ON roles.rol_id = usuarios.rol_id WHERE email = $1",
      [correo]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "Credenciales inválidas." });
    }
    const user = userResult.rows[0];
    const validPassword = await bcrypt.compare(contrasena, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ message: "Credenciales inválidas." });
    }

    const token = jwt.sign(
      { userId: user.id, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );
    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        correo: user.correo,
        rol: user.rol,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};
