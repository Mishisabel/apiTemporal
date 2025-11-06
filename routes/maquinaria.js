// routes/maquinaria.js
const express = require('express');
const router = express.Router();
const maquinariaController = require('../controllers/maquinariaController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/estados', maquinariaController.getEstadosMaquinaria);
router.get('/dsad',authMiddleware, maquinariaController.getAllMaquinaria);
router.get('/frentes', maquinariaController.getFrentesMaquinaria);
// router.post('/codigoActivo', maquinariaController.codigoActivo);
router.post('/crearMaquinaria', maquinariaController.createMaquinaria);
router.delete('/fdgfdg:id', maquinariaController.deleteMaquinaria);

module.exports = router;