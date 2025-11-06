// routes/mensajes.js
const express = require('express');
const router = express.Router();
const mensajesController = require('../controllers/mensajesController');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/mensajes/historial/:id
// Obtiene el historial de chat con un usuario específico
router.get(
  '/historial/:id',
  authMiddleware,
  mensajesController.getHistorialChat
);

module.exports = router;