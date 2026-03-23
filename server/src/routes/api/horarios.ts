import { Router } from 'express';
import { HorariosController } from '../../controllers/horarios.controller';

const router = Router();

// Rutas de horarios
router.get('/', HorariosController.getHorarios);
router.get('/:id', HorariosController.getHorarioById);
router.post('/', HorariosController.createHorario);
router.put('/:id', HorariosController.updateHorario);
router.delete('/:id', HorariosController.deleteHorario);

export default router;
