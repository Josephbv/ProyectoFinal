"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ventas_controller_1 = require("../../controllers/ventas.controller");
const router = (0, express_1.Router)();
// Rutas de ventas
router.get('/', ventas_controller_1.VentasController.getVentas);
router.get('/:id', ventas_controller_1.VentasController.getVentaById);
router.post('/', ventas_controller_1.VentasController.createVenta);
router.patch('/anular/:id', ventas_controller_1.VentasController.anularVenta);
router.delete('/', ventas_controller_1.VentasController.deleteAllVentas);
exports.default = router;
