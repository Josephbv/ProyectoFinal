import { Router } from 'express';
import { MascotasController } from '../../controllers/mascotas.controller';

const router = Router();

// Rutas de mascotas
router.get('/', MascotasController.getMascotas);
router.get('/:id', MascotasController.getMascotaById);
router.post('/', MascotasController.createMascota);
router.put('/:id', MascotasController.updateMascota);
router.delete('/:id', MascotasController.deleteMascota);

export default router;
