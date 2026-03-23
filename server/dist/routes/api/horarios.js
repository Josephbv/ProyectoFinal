"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const horarios_controller_1 = require("../../controllers/horarios.controller");
const router = (0, express_1.Router)();
// Rutas de horarios
router.get('/', horarios_controller_1.HorariosController.getHorarios);
router.get('/:id', horarios_controller_1.HorariosController.getHorarioById);
router.post('/', horarios_controller_1.HorariosController.createHorario);
router.put('/:id', horarios_controller_1.HorariosController.updateHorario);
router.delete('/:id', horarios_controller_1.HorariosController.deleteHorario);
exports.default = router;
