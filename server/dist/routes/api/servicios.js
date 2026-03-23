"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const servicios_controller_1 = require("../../controllers/servicios.controller");
const router = (0, express_1.Router)();
// Rutas de servicios
router.get('/', servicios_controller_1.ServiciosController.getServicios);
router.get('/:id', servicios_controller_1.ServiciosController.getServicioById);
router.post('/', servicios_controller_1.ServiciosController.createServicio);
router.put('/:id', servicios_controller_1.ServiciosController.updateServicio);
router.delete('/:id', servicios_controller_1.ServiciosController.deleteServicio);
exports.default = router;
