import { Router } from 'express';
import { EmpleadosController } from '../../controllers/empleados.controller';

const router = Router();

// Rutas de empleados
router.get('/', EmpleadosController.getEmpleados);
router.get('/:id', EmpleadosController.getEmpleadoById);
router.post('/', EmpleadosController.createEmpleado);
router.put('/:id', EmpleadosController.updateEmpleado);
router.delete('/:id', EmpleadosController.deleteEmpleado);

export default router;
