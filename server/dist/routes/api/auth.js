"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../../controllers/auth.controller");
const router = (0, express_1.Router)();
// Rutas de autenticación
router.post('/register', auth_controller_1.AuthController.register);
router.post('/login', auth_controller_1.AuthController.login);
router.get('/users', auth_controller_1.AuthController.getUsers);
router.put('/users/:id', auth_controller_1.AuthController.updateUser);
router.delete('/users/:id', auth_controller_1.AuthController.deleteUser);
router.post('/request-reset', auth_controller_1.AuthController.requestReset);
router.post('/reset-password', auth_controller_1.AuthController.resetPassword);
exports.default = router;
