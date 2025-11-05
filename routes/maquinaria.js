// routes/maquinaria.js
const express = require('express');
const router = express.Router();
const maquinariaController = require('../controllers/maquinariaController');

router.get('/estados', maquinariaController.getEstadosMaquinaria);
router.get('/dsad', maquinariaController.getAllMaquinaria);
router.get('/frentes', maquinariaController.getFrentesMaquinaria);
// router.post('/codigoActivo', maquinariaController.codigoActivo);
router.post('/crearMaquinaria', maquinariaController.createMaquinaria);
router.delete('/fdgfdg:id', maquinariaController.deleteMaquinaria);

module.exports = router;