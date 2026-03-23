import { Router } from 'express';
import { AgendamientoController } from '../../controllers/agendamiento.controller';

const router = Router();

// Rutas de agendamiento (citas)
router.get('/', AgendamientoController.getAgendamientos);
router.get('/:id', AgendamientoController.getAgendamientoById);
router.post('/', AgendamientoController.createAgendamiento);
router.put('/:id', AgendamientoController.updateAgendamiento);
router.delete('/:id', AgendamientoController.deleteAgendamiento);

export default router;
