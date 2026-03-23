"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const usuarios_controller_1 = require("../../controllers/usuarios.controller");
const router = (0, express_1.Router)();
// Rutas de usuarios
router.get('/', usuarios_controller_1.UsuariosController.getUsuarios);
router.get('/:id', usuarios_controller_1.UsuariosController.getUsuarioById);
router.post('/', usuarios_controller_1.UsuariosController.createUsuario);
router.put('/:id', usuarios_controller_1.UsuariosController.updateUsuario);
router.delete('/:id', usuarios_controller_1.UsuariosController.deleteUsuario);
router.post('/forgot-password', usuarios_controller_1.UsuariosController.forgotPassword);
router.post('/reset-password', usuarios_controller_1.UsuariosController.resetPassword);
exports.default = router;
