import { Router, Request, Response } from 'express';
import prisma from '../prismaClient';

const router = Router();

// GET /api/roles
router.get('/', async (_req: Request, res: Response) => {
    try {
        const rolesList = await prisma.roles.findMany({
            include: { roles_permisos: { include: { permiso: true } } }
        });

        // Map to match frontend expectations
        const mappedRoles = rolesList.map(r => ({
            id: r.id_rol.toString(),
            nombre: r.nombre_rol,
            activo: r.activo ?? true,
            modulos: r.roles_permisos.map(rp => rp.permiso.descripcion || ""),
            fechaModificacion: new Date().toISOString().split('T')[0] // Placeholder
        }));

        res.json(mappedRoles);
    } catch (error) {
        console.error('[ROLES] GET ERROR:', error);
        res.status(500).json({ error: 'Error al obtener roles' });
    }
});

// POST /api/roles
router.post('/', async (req: Request, res: Response) => {
    try {
        const { nombre, activo, modulos } = req.body;
        if (!nombre) return res.status(400).json({ error: 'Nombre de rol es obligatorio' });

        const nuevo = await prisma.roles.create({
            data: {
                nombre_rol: nombre,
                activo: activo ?? true
            }
        });

        // Sync permissions if provided
        if (Array.isArray(modulos) && modulos.length > 0) {
            for (const modulo of modulos) {
                // Find or create permission
                let permiso = await prisma.permisos.findFirst({
                    where: { descripcion: modulo }
                });

                if (!permiso) {
                    permiso = await prisma.permisos.create({
                        data: { descripcion: modulo }
                    });
                }

                // Link to role
                await prisma.roles_permisos.create({
                    data: {
                        id_rol: nuevo.id_rol,
                        id_permiso: permiso.id_permiso
                    }
                });
            }
        }

        res.status(201).json({
            id: nuevo.id_rol.toString(),
            nombre: nuevo.nombre_rol,
            activo: nuevo.activo,
            modulos: modulos || [],
            fechaModificacion: new Date().toISOString().split('T')[0]
        });
    } catch (error) {
        console.error('[ROLES] POST ERROR:', error);
        res.status(500).json({ error: 'Error al crear rol' });
    }
});

// PUT /api/roles/:id
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const id_rol = parseInt(req.params.id as string);
        const { nombre, activo, modulos } = req.body;

        const actualizado = await prisma.roles.update({
            where: { id_rol },
            data: {
                nombre_rol: nombre,
                activo: activo
            }
        });

        // Sync permissions if provided
        if (Array.isArray(modulos)) {
            // Remove old permissions
            await prisma.roles_permisos.deleteMany({
                where: { id_rol }
            });

            // Add new ones
            for (const modulo of modulos) {
                let permiso = await prisma.permisos.findFirst({
                    where: { descripcion: modulo }
                });

                if (!permiso) {
                    permiso = await prisma.permisos.create({
                        data: { descripcion: modulo }
                    });
                }

                await prisma.roles_permisos.create({
                    data: {
                        id_rol: actualizado.id_rol,
                        id_permiso: permiso.id_permiso
                    }
                });
            }
        }

        res.json({
            id: actualizado.id_rol.toString(),
            nombre: actualizado.nombre_rol,
            activo: actualizado.activo,
            modulos: modulos || [],
            fechaModificacion: new Date().toISOString().split('T')[0]
        });
    } catch (error) {
        console.error('[ROLES] PUT ERROR:', error);
        res.status(500).json({ error: 'Error al actualizar rol' });
    }
});

// DELETE /api/roles/:id
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const id_rol = parseInt(req.params.id as string);

        // 1. Safety Checks
        const rol = await prisma.roles.findUnique({
            where: { id_rol },
            include: { _count: { select: { usuarios: true } } }
        });

        if (!rol) {
            return res.status(404).json({ error: 'Rol no encontrado' });
        }

        if (rol.nombre_rol.toLowerCase() === 'administrador') {
            return res.status(400).json({ error: 'No se puede eliminar el rol de Administrador' });
        }

        if (rol._count.usuarios > 0) {
            return res.status(400).json({ error: 'No se puede eliminar un rol que tiene usuarios asignados' });
        }

        // 2. Delete permission links first (Prisma doesn't have cascade here in schema)
        await prisma.roles_permisos.deleteMany({
            where: { id_rol }
        });

        // 3. Delete the role
        await prisma.roles.delete({ where: { id_rol } });

        res.status(204).send();
    } catch (error) {
        console.error('[ROLES] DELETE ERROR:', error);
        res.status(500).json({ error: 'Error al eliminar rol' });
    }
});

// GET /api/roles/by-name/:roleName - Get modules for a role by name
router.get('/by-name/:roleName', async (req: Request, res: Response) => {
    try {
        const roleName = req.params.roleName?.toLowerCase();
        const rol = await prisma.roles.findFirst({
            where: { nombre_rol: { contains: roleName } },
            include: { roles_permisos: { include: { permiso: true } } }
        });

        if (!rol) {
            return res.json({ modulos: [] });
        }

        const modulos = rol.roles_permisos.map(rp => rp.permiso.descripcion || '').filter(Boolean);
        res.json({ modulos, nombre_rol: rol.nombre_rol });
    } catch (error) {
        console.error('[ROLES] GET by-name ERROR:', error);
        res.status(500).json({ error: 'Error al obtener módulos del rol' });
    }
});

export default router;
