// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config(); // <-- Añade esto por si acaso

module.exports = function(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verificar el token con el mismo secreto del login
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Esta es la línea clave que faltaba o fallaba:
    req.user = decoded; // decoded = { userId: 123, rol: 'Analista' }
    
    next(); // Continuar a la ruta del controlador
  } catch (ex) {
    console.error("Error de autenticación, token inválido:", ex.message);
    res.status(400).json({ message: 'Token inválido.' });
  }
};