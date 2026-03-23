import { Router } from 'express';
import { RolesController } from '../../controllers/roles.controller';

const router = Router();

// Rutas de roles
router.get('/', RolesController.getRoles);
router.post('/', RolesController.createRole);
router.put('/:id', RolesController.updateRole);
router.delete('/:id', RolesController.deleteRole);
router.get('/by-name/:roleName', RolesController.getRoleByName);

export default router;
