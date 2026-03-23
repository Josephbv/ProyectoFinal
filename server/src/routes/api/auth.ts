import { Router } from 'express';
import { AuthController } from '../../controllers/auth.controller';

const router = Router();

// Rutas de autenticación
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/users', AuthController.getUsers);
router.put('/users/:id', AuthController.updateUser);
router.delete('/users/:id', AuthController.deleteUser);
router.post('/request-reset', AuthController.requestReset);
router.post('/reset-password', AuthController.resetPassword);

export default router;
