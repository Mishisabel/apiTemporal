// routes/ordenesTrabajo.js
const express = require('express');
const router = express.Router();
const ordenesController = require('../controllers/ordenesTrabajoController');
const authMiddleware = require('../middleware/authMiddleware');

router.post(
  '/inicio-mtto',authMiddleware,
  ordenesController.createOrdenInicioMtto
);

router.get(
  '/todas',
  authMiddleware,
  ordenesController.getAllOrdenesTrabajo
);

module.exports = router;