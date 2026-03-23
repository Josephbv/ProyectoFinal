import { Router } from 'express';
import { ServiciosController } from '../../controllers/servicios.controller';

const router = Router();

// Rutas de servicios
router.get('/', ServiciosController.getServicios);
router.get('/:id', ServiciosController.getServicioById);
router.post('/', ServiciosController.createServicio);
router.put('/:id', ServiciosController.updateServicio);
router.delete('/:id', ServiciosController.deleteServicio);

export default router;
