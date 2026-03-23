"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const agendamiento_controller_1 = require("../../controllers/agendamiento.controller");
const router = (0, express_1.Router)();
// Rutas de agendamiento (citas)
router.get('/', agendamiento_controller_1.AgendamientoController.getAgendamientos);
router.get('/:id', agendamiento_controller_1.AgendamientoController.getAgendamientoById);
router.post('/', agendamiento_controller_1.AgendamientoController.createAgendamiento);
router.put('/:id', agendamiento_controller_1.AgendamientoController.updateAgendamiento);
router.delete('/:id', agendamiento_controller_1.AgendamientoController.deleteAgendamiento);
exports.default = router;
