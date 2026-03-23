"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const clientes_controller_1 = require("../../controllers/clientes.controller");
const router = (0, express_1.Router)();
// Rutas de clientes vinculadas al controlador
router.get('/', clientes_controller_1.ClientesController.getClientes);
router.get('/:id', clientes_controller_1.ClientesController.getClienteById);
router.post('/', clientes_controller_1.ClientesController.createCliente);
router.put('/:id', clientes_controller_1.ClientesController.updateCliente);
router.delete('/:id', clientes_controller_1.ClientesController.deleteCliente);
exports.default = router;
