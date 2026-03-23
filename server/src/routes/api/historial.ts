import { Router } from 'express';
import { HistorialController } from '../../controllers/historial.controller';

const router = Router();

// Rutas de historial médico
router.get('/', HistorialController.getHistorial);
router.get('/mascota/:id', HistorialController.getHistorialByMascota);
router.get('/:id', HistorialController.getHistorialById);
router.post('/', HistorialController.createHistorial);
router.put('/:id', HistorialController.updateHistorial);
router.delete('/:id', HistorialController.deleteHistorial);

export default router;
