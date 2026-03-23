"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mascotas_controller_1 = require("../../controllers/mascotas.controller");
const router = (0, express_1.Router)();
// Rutas de mascotas
router.get('/', mascotas_controller_1.MascotasController.getMascotas);
router.get('/:id', mascotas_controller_1.MascotasController.getMascotaById);
router.post('/', mascotas_controller_1.MascotasController.createMascota);
router.put('/:id', mascotas_controller_1.MascotasController.updateMascota);
router.delete('/:id', mascotas_controller_1.MascotasController.deleteMascota);
exports.default = router;
