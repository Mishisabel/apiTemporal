// routes/ordenesTrabajo.js
const express = require('express');
const router = express.Router();
const ordenesController = require('../controllers/ordenesTrabajoController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/ordenes/inicio-mtto
// Esta ruta estará protegida y usará el middleware
router.post(
  '/inicio-mtto', 
  authMiddleware, 
  ordenesController.createOrdenInicioMtto
);

module.exports = router;