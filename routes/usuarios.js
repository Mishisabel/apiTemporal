const express = require("express");
const router = express.Router();
const authController = require("../controllers/autController");
const authMiddleware = require("../middleware/authMiddleware");
const usuariosController = require("../controllers/usuariosController");

router.post("/register", authController.register);
router.post("/login", authController.login);

router.get("/lista", authMiddleware, usuariosController.getAllUsuarios);

module.exports = router;
