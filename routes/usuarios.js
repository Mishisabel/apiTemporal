// routes/usuarios.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/autController');

router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;