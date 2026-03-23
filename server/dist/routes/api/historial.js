"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const historial_controller_1 = require("../../controllers/historial.controller");
const router = (0, express_1.Router)();
// Rutas de historial médico
router.get('/', historial_controller_1.HistorialController.getHistorial);
router.get('/mascota/:id', historial_controller_1.HistorialController.getHistorialByMascota);
router.get('/:id', historial_controller_1.HistorialController.getHistorialById);
router.post('/', historial_controller_1.HistorialController.createHistorial);
router.put('/:id', historial_controller_1.HistorialController.updateHistorial);
router.delete('/:id', historial_controller_1.HistorialController.deleteHistorial);
exports.default = router;
