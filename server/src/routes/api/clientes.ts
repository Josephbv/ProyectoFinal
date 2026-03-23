import { Router } from 'express';
import { ClientesController } from '../../controllers/clientes.controller';

const router = Router();

// Rutas de clientes vinculadas al controlador
router.get('/', ClientesController.getClientes);
router.get('/:id', ClientesController.getClienteById);
router.post('/', ClientesController.createCliente);
router.put('/:id', ClientesController.updateCliente);
router.delete('/:id', ClientesController.deleteCliente);

export default router;
