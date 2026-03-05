import { Router, Request, Response } from 'express';
import prisma from '../prismaClient';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const SECRET = process.env.JWT_SECRET || 'kaivet_secret';

// POST /api/auth/register - Registrar un nuevo usuario
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { correo, contrasena, nombre_usuario, nombre_rol, cedula, id_cliente, id_empleado } = req.body;

        if (!correo || !contrasena || !nombre_usuario) {
            return res.status(400).json({ error: 'Correo, contraseña y nombre_usuario son obligatorios' });
        }

        const existe = await prisma.usuario.findFirst({ where: { correo } });
        if (existe) return res.status(400).json({ error: 'El correo ya está registrado' });

        let rolDb = await prisma.roles.findFirst({
            where: { nombre_rol: nombre_rol || 'Admin' }
        });

        if (!rolDb) {
            rolDb = await prisma.roles.create({ data: { nombre_rol: nombre_rol || 'Admin' } });
        }

        const hashedPassword = await bcrypt.hash(contrasena, 10);

        const usuario = await prisma.usuario.create({
            data: {
                correo,
                contrasena: hashedPassword,
                nombre_usuario,
                id_rol: rolDb.id_rol,
                cedula,
                id_cliente: id_cliente ? parseInt(id_cliente) : null,
                id_empleado: id_empleado ? parseInt(id_empleado) : null,
                activo: true
            },
        });

        const token = jwt.sign({ id: usuario.id_usuario, email: usuario.correo }, SECRET, { expiresIn: '24h' });
        res.status(201).json({
            token,
            usuario: {
                id_usuario: usuario.id_usuario,
                correo: usuario.correo,
                nombre_usuario: usuario.nombre_usuario,
                id_rol: usuario.id_rol,
                cedula: usuario.cedula,
                id_cliente: usuario.id_cliente,
                id_empleado: usuario.id_empleado,
                nombre_completo: usuario.nombre_completo,
                grupo_usuario: usuario.grupo_usuario,
                permisos_especificos: usuario.permisos_especificos,
                estado: usuario.estado
            }
        });
    } catch (error) {
        console.error('[AUTH] ERROR EN REGISTRO:', error);
        res.status(500).json({ error: 'Error interno del servidor al registrar.' });
    }
});

// POST /api/auth/login - Iniciar sesión
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { correo, contrasena } = req.body;

        if (!correo || !contrasena) {
            return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
        }

        const usuario = await prisma.usuario.findFirst({
            where: { correo },
            include: { rol: true } // Incluimos el rol para el frontend
        });

        if (!usuario) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        if (usuario.activo === false) {
            return res.status(403).json({ error: 'Esta cuenta está desactivada' });
        }

        const valido = await bcrypt.compare(contrasena, usuario.contrasena);
        if (!valido) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const token = jwt.sign({ id: usuario.id_usuario, email: usuario.correo, rol: usuario.rol.nombre_rol }, SECRET, { expiresIn: '24h' });
        res.json({
            token,
            usuario: {
                id_usuario: usuario.id_usuario,
                correo: usuario.correo,
                nombre_usuario: usuario.nombre_usuario,
                id_rol: usuario.id_rol,
                rol: usuario.rol.nombre_rol,
                cedula: usuario.cedula,
                id_cliente: usuario.id_cliente,
                id_empleado: usuario.id_empleado,
                nombre_completo: usuario.nombre_completo,
                grupo_usuario: usuario.grupo_usuario,
                permisos_especificos: usuario.permisos_especificos,
                estado: usuario.estado
            }
        });
    } catch (error) {
        console.error('[AUTH] ERROR EN LOGIN:', error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

// GET /api/auth/users - Obtener todos los usuarios
router.get('/users', async (_req: Request, res: Response) => {
    try {
        const usuarios = await prisma.usuario.findMany({
            include: { rol: true }
        });
        res.json(usuarios);
    } catch (error) {
        console.error('[AUTH] ERROR AL LISTAR USUARIOS:', error);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

// PUT /api/auth/users/:id - Actualizar un usuario
router.put('/users/:id', async (req: Request, res: Response) => {
    try {
        const id_usuario = parseInt(req.params.id as string);
        const { nombre_usuario, correo, contrasena, id_rol, nombre_rol, cedula, activo, id_cliente, id_empleado } = req.body;

        const data: any = {};
        if (nombre_usuario) data.nombre_usuario = nombre_usuario;
        if (correo) data.correo = correo;
        if (cedula !== undefined) data.cedula = cedula;
        if (activo !== undefined) data.activo = activo;
        if (id_cliente !== undefined) data.id_cliente = id_cliente;
        if (id_empleado !== undefined) data.id_empleado = id_empleado;

        if (nombre_rol) {
            let rolDb = await prisma.roles.findFirst({ where: { nombre_rol } });
            if (!rolDb) {
                rolDb = await prisma.roles.create({ data: { nombre_rol } });
            }
            data.id_rol = rolDb.id_rol;
        } else if (id_rol) {
            data.id_rol = parseInt(id_rol as string);
        }

        if (contrasena) {
            data.contrasena = await bcrypt.hash(contrasena, 10);
        }

        const actualizada = await prisma.usuario.update({
            where: { id_usuario },
            data,
            include: { rol: true }
        });

        res.json(actualizada);
    } catch (error) {
        console.error('[AUTH] ERROR EN PUT /users/:id:', error);
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
});

// DELETE /api/auth/users/:id - Eliminar un usuario
router.delete('/users/:id', async (req: Request, res: Response) => {
    try {
        const id_usuario = parseInt(req.params.id as string);
        await prisma.usuario.delete({ where: { id_usuario } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
});

export default router;
