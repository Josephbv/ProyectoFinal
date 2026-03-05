import { Router, Request, Response } from 'express';
import prisma from '../../prismaClient';

const router = Router();

// GET /api/usuarios
router.get('/', async (_req: Request, res: Response) => {
    try {
        const usuarios = await prisma.usuario.findMany({
            include: { rol: true } // Return role info too for the UI table
        });
        res.json(usuarios);
    } catch (error) {
        console.error('[USUARIOS] GET ERROR:', error);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

// GET /api/usuarios/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const id_usuario = parseInt(req.params.id as string);
        const usuario = await prisma.usuario.findUnique({
            where: { id_usuario },
            include: { rol: true }
        });
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(usuario);
    } catch (error) {
        console.error('[USUARIOS] GET BY ID ERROR:', error);
        res.status(500).json({ error: 'Error al obtener el usuario' });
    }
});

// POST /api/usuarios
router.post('/', async (req: Request, res: Response) => {
    try {
        const {
            nombre_usuario, contrasena, correo, cedula,
            id_rol, nombre_rol, nombre_completo, grupo_usuario,
            permisos_especificos, pregunta_seguridad,
            respuesta_seguridad, estado, activo
        } = req.body;

        if (!nombre_usuario || !contrasena || (!id_rol && !nombre_rol)) {
            return res.status(400).json({ error: 'Nombre de usuario, contraseña y rol son obligatorios' });
        }

        // Validate duplicates
        if (correo) {
            const dupCorreo = await prisma.usuario.findUnique({ where: { correo } });
            if (dupCorreo) return res.status(400).json({ error: 'Ya existe un usuario con ese correo' });
        }

        if (cedula) {
            const dupCedula = await prisma.usuario.findUnique({ where: { cedula } });
            if (dupCedula) return res.status(400).json({ error: 'Ya existe un usuario con esa cédula' });
        }

        let rolIdToUse = id_rol ? parseInt(id_rol.toString()) : null;

        if (nombre_rol && !id_rol) {
            let rolDb = await prisma.roles.findFirst({
                where: { nombre_rol: nombre_rol }
            });
            if (!rolDb) {
                rolDb = await prisma.roles.create({ data: { nombre_rol: nombre_rol } });
            }
            rolIdToUse = rolDb.id_rol;
        }

        const newUser = await prisma.usuario.create({
            data: {
                nombre_usuario,
                contrasena: contrasena, // For production: require a bcrypt hash here. We will assume plaintext or UI hashing for now to match other routes
                correo,
                cedula,
                id_rol: rolIdToUse as number,
                nombre_completo,
                grupo_usuario,
                permisos_especificos,
                pregunta_seguridad,
                respuesta_seguridad,
                estado: estado || 'activo',
                activo: activo ?? true
            }
        });

        res.status(201).json(newUser);
    } catch (error) {
        console.error('[USUARIOS] POST ERROR:', error);
        res.status(500).json({ error: 'Error al crear el usuario' });
    }
});

// PUT /api/usuarios/:id
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const id_usuario = parseInt(req.params.id as string);
        const {
            nombre_usuario, contrasena, correo, cedula,
            id_rol, nombre_rol, nombre_completo, grupo_usuario,
            permisos_especificos, pregunta_seguridad,
            respuesta_seguridad, estado, activo
        } = req.body;

        const updateData: any = {
            nombre_usuario,
            correo,
            cedula,
            nombre_completo,
            grupo_usuario,
            permisos_especificos,
            pregunta_seguridad,
            respuesta_seguridad,
            estado,
            activo
        };

        if (contrasena) {
            // Basic replacement. Production implies hashing here as well.
            updateData.contrasena = contrasena;
        }

        if (nombre_rol) {
            let rolDb = await prisma.roles.findFirst({
                where: { nombre_rol: nombre_rol }
            });
            if (!rolDb) {
                rolDb = await prisma.roles.create({ data: { nombre_rol: nombre_rol } });
            }
            updateData.id_rol = rolDb.id_rol;
        } else if (id_rol) {
            updateData.id_rol = parseInt(id_rol.toString());
        }

        const updated = await prisma.usuario.update({
            where: { id_usuario },
            data: updateData
        });

        res.json(updated);
    } catch (error) {
        console.error('[USUARIOS] PUT ERROR:', error);
        res.status(500).json({ error: 'Error al actualizar el usuario' });
    }
});

// DELETE /api/usuarios/:id
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const id_usuario = parseInt(req.params.id as string);

        // Disconnect relations safely before deleting
        const usr = await prisma.usuario.findUnique({
            where: { id_usuario }
        });

        if (!usr) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        await prisma.usuario.delete({
            where: { id_usuario }
        });

        res.status(204).send();
    } catch (error) {
        console.error('[USUARIOS] DELETE ERROR:', error);
        res.status(500).json({ error: 'Error al eliminar el usuario' });
    }
});

export default router;
