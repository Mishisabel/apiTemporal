const express = require('express');
const router = express.Router();
const mensajesController = require('../controllers/mensajesController');
const authMiddleware = require('../middleware/authMiddleware');


router.get(
  '/historial/:id',
  authMiddleware,
  mensajesController.getHistorialChat
);

module.exports = router;