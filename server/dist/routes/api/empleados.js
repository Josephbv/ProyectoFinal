"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const empleados_controller_1 = require("../../controllers/empleados.controller");
const router = (0, express_1.Router)();
// Rutas de empleados
router.get('/', empleados_controller_1.EmpleadosController.getEmpleados);
router.get('/:id', empleados_controller_1.EmpleadosController.getEmpleadoById);
router.post('/', empleados_controller_1.EmpleadosController.createEmpleado);
router.put('/:id', empleados_controller_1.EmpleadosController.updateEmpleado);
router.delete('/:id', empleados_controller_1.EmpleadosController.deleteEmpleado);
exports.default = router;
