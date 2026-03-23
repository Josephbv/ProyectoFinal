import { Router } from 'express';
import { UsuariosController } from '../../controllers/usuarios.controller';

const router = Router();

// Rutas de usuarios
router.get('/', UsuariosController.getUsuarios);
router.get('/:id', UsuariosController.getUsuarioById);
router.post('/', UsuariosController.createUsuario);
router.put('/:id', UsuariosController.updateUsuario);
router.delete('/:id', UsuariosController.deleteUsuario);
router.post('/forgot-password', UsuariosController.forgotPassword);
router.post('/reset-password', UsuariosController.resetPassword);

export default router;
