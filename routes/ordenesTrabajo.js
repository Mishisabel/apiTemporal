// routes/ordenesTrabajo.js
const express = require('express');
const router = express.Router();
const ordenesController = require('../controllers/ordenesTrabajoController');
const authMiddleware = require('../middleware/authMiddleware');

router.post(
  '/inicio-mtto',authMiddleware,
  ordenesController.createOrdenInicioMtto
);

router.put(
  '/finalizar/:id',
  authMiddleware, // Necesario para verificar el rol de Operador
  ordenesController.finalizarOrdenTrabajo
);

router.get(
  '/todas',
  authMiddleware,
  ordenesController.getAllOrdenesTrabajo
);

router.get(
  '/reporte/excel',
  authMiddleware,
  ordenesController.exportarReporteExcel
);
module.exports = router;