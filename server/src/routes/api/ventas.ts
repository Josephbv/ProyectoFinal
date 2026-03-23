import { Router } from 'express';
import { VentasController } from '../../controllers/ventas.controller';

const router = Router();

// Rutas de ventas
router.get('/', VentasController.getVentas);
router.get('/:id', VentasController.getVentaById);
router.post('/', VentasController.createVenta);
router.patch('/anular/:id', VentasController.anularVenta);
router.delete('/', VentasController.deleteAllVentas);

export default router;
