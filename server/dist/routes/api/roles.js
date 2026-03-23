"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const roles_controller_1 = require("../../controllers/roles.controller");
const router = (0, express_1.Router)();
// Rutas de roles
router.get('/', roles_controller_1.RolesController.getRoles);
router.post('/', roles_controller_1.RolesController.createRole);
router.put('/:id', roles_controller_1.RolesController.updateRole);
router.delete('/:id', roles_controller_1.RolesController.deleteRole);
router.get('/by-name/:roleName', roles_controller_1.RolesController.getRoleByName);
exports.default = router;
