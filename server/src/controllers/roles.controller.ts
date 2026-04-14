import { Request, Response } from 'express';
import prisma from '../config/prisma';

export class RolesController {
    static async getRoles(_req: Request, res: Response) {
        try {
            console.log('[ROLES] GET / triggered');

            // 1. Core Roles Configuration
            const coreRolesDef = [
                { nombre: 'Administrador', modulos: ['Dashboard', 'Ventas', 'Clientes', 'Agendamiento', 'Mascotas', 'Historial Mascotas', 'Horario', 'Servicios', 'Empleados', 'Roles', 'Usuarios'] },
                { nombre: 'Veterinario', modulos: ['Ventas', 'Agendamiento', 'Mascotas', 'Historial Mascotas', 'Horario', 'Servicios'] },
                { nombre: 'Cliente', modulos: ['Ventas', 'Clientes', 'Agendamiento', 'Mascotas', 'Historial Mascotas'] }
            ];

            // 2. Initial Setup: Create missing core roles if they don't exist
            for (const core of coreRolesDef) {
                try {
                    const existing = await prisma.roles.findMany({
                        where: { nombre_rol: core.nombre }
                    });

                    let mainRol: any;
                    if (existing.length === 0) {
                        console.log(`[ROLES] Creating missing role: ${core.nombre}`);
                        mainRol = await prisma.roles.create({
                            data: { nombre_rol: core.nombre, activo: true }
                        });
                    } else {
                        mainRol = existing.sort((a, b) => a.id_rol - b.id_rol)[0];

                        if (existing.length > 1) {
                            console.log(`[ROLES] Cleaning up duplicates for: ${core.nombre}`);
                            const duplicates = existing.filter(r => r.id_rol !== mainRol.id_rol);
                            for (const dup of duplicates) {
                                await prisma.usuario.updateMany({ where: { id_rol: dup.id_rol }, data: { id_rol: mainRol.id_rol } });
                                await prisma.roles_permisos.deleteMany({ where: { id_rol: dup.id_rol } });
                                await prisma.roles.delete({ where: { id_rol: dup.id_rol } });
                            }
                        }
                    }

                    const currentPerms = await prisma.roles_permisos.findMany({
                        where: { id_rol: mainRol.id_rol },
                        include: { permiso: true }
                    });
                    const currentModNames = currentPerms.map(p => p.permiso.descripcion);

                    if (JSON.stringify(currentModNames.sort()) !== JSON.stringify(core.modulos.sort())) {
                        console.log(`[ROLES] Syncing permissions for: ${core.nombre}`);
                        await prisma.roles_permisos.deleteMany({ where: { id_rol: mainRol.id_rol } });
                        for (const moduloName of core.modulos) {
                            let permiso = await prisma.permisos.findFirst({ where: { descripcion: moduloName } });
                            if (!permiso) permiso = await prisma.permisos.create({ data: { descripcion: moduloName } });
                            await prisma.roles_permisos.create({
                                data: { id_rol: mainRol.id_rol, id_permiso: permiso.id_permiso }
                            });
                        }
                    }
                } catch (roleErr) {
                    console.error(`[ROLES] Error processing role ${core.nombre}:`, roleErr);
                }
            }

            // 3. Return final list
            const rolesList = await prisma.roles.findMany({
                include: { roles_permisos: { include: { permiso: true } } }
            });

            const mapped = rolesList.map(r => ({
                id: r.id_rol.toString(),
                nombre: r.nombre_rol,
                activo: r.activo ?? true,
                modulos: r.roles_permisos.map(rp => rp.permiso.descripcion || ""),
                fechaModificacion: new Date().toISOString().split('T')[0]
            }));

            console.log(`[ROLES] Success. Found ${mapped.length} roles.`);
            res.json(mapped);
        } catch (error) {
            console.error('[ROLES] CRITICAL GET ERROR:', error);
            res.status(500).json({ error: 'Error al obtener los roles' });
        }
    }

    static async createRole(req: Request, res: Response) {
        try {
            const { nombre, activo, modulos } = req.body;
            if (!nombre) return res.status(400).json({ error: 'Nombre es obligatorio' });

            const reserved = ['administrador', 'cliente', 'veterinario'];
            if (reserved.includes(nombre.toLowerCase().trim())) {
                return res.status(400).json({ error: 'Ese nombre de rol está reservado.' });
            }

            const existingRol = await prisma.roles.findFirst({
                where: { nombre_rol: { equals: nombre } }
            });
            if (existingRol) {
                return res.status(400).json({ error: 'Ya existe un rol con ese nombre.' });
            }

            if (!modulos || !Array.isArray(modulos) || modulos.length === 0) {
                return res.status(400).json({ error: 'Debe asignar por lo menos un (1) módulo al rol.' });
            }

            const nuevo = await prisma.roles.create({
                data: { nombre_rol: nombre, activo: activo ?? true }
            });

            if (Array.isArray(modulos)) {
                for (const mod of modulos) {
                    let p = await prisma.permisos.findFirst({ where: { descripcion: mod } });
                    if (!p) p = await prisma.permisos.create({ data: { descripcion: mod } });
                    await prisma.roles_permisos.create({ data: { id_rol: nuevo.id_rol, id_permiso: p.id_permiso } });
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
    }

    static async updateRole(req: Request, res: Response) {
        try {
            const id_rol = parseInt(req.params.id as string);
            const { nombre, activo, modulos } = req.body;

            const base = await prisma.roles.findUnique({ where: { id_rol } });
            if (!base) return res.status(404).json({ error: 'No encontrado' });

            if (base.nombre_rol.toLowerCase() === 'administrador') {
                return res.status(400).json({ error: 'No se puede editar el administrador.' });
            }

            if (nombre && nombre.toLowerCase().trim() !== base.nombre_rol.toLowerCase().trim()) {
                const existingRol = await prisma.roles.findFirst({
                    where: { nombre_rol: { equals: nombre } }
                });
                if (existingRol) {
                    return res.status(400).json({ error: 'Ya existe otro rol con ese nombre.' });
                }
            }

            if (modulos !== undefined && (!Array.isArray(modulos) || modulos.length === 0)) {
                return res.status(400).json({ error: 'Debe asignar por lo menos un (1) módulo al rol.' });
            }

            const updated = await prisma.roles.update({
                where: { id_rol },
                data: { nombre_rol: nombre, activo: activo }
            });

            if (Array.isArray(modulos)) {
                await prisma.roles_permisos.deleteMany({ where: { id_rol } });
                for (const mod of modulos) {
                    let p = await prisma.permisos.findFirst({ where: { descripcion: mod } });
                    if (!p) p = await prisma.permisos.create({ data: { descripcion: mod } });
                    await prisma.roles_permisos.create({ data: { id_rol: updated.id_rol, id_permiso: p.id_permiso } });
                }
            }

            res.json({
                id: updated.id_rol.toString(),
                nombre: updated.nombre_rol,
                activo: updated.activo,
                modulos: modulos || [],
                fechaModificacion: new Date().toISOString().split('T')[0]
            });
        } catch (error) {
            console.error('[ROLES] PUT ERROR:', error);
            res.status(500).json({ error: 'Error al actualizar.' });
        }
    }

    static async deleteRole(req: Request, res: Response) {
        try {
            const id_rol = parseInt(req.params.id as string);
            const rol = await prisma.roles.findUnique({
                where: { id_rol },
                include: { usuarios: true }
            });

            if (!rol) return res.status(404).json({ error: 'No encontrado' });

            if (rol.nombre_rol.toLowerCase() === 'administrador') {
                return res.status(400).json({ error: 'No se puede eliminar el rol Administrador del sistema.' });
            }

            if (rol.usuarios && rol.usuarios.length > 0) {
                return res.status(400).json({
                    error: `No se puede eliminar el rol "${rol.nombre_rol}" porque tiene ${rol.usuarios.length} usuario(s) asociado(s). Cambia sus roles primero.`
                });
            }

            await prisma.roles_permisos.deleteMany({ where: { id_rol } });
            await prisma.roles.delete({ where: { id_rol } });

            res.status(204).send();
        } catch (error) {
            console.error('[ROLES] DELETE ERROR:', error);
            res.status(500).json({ error: 'Error al eliminar.' });
        }
    }

    static async getRoleByName(req: Request, res: Response) {
        try {
            const name = String(req.params.roleName).trim().toLowerCase();
            let rol = await prisma.roles.findFirst({
                where: { nombre_rol: { equals: name } },
                include: { roles_permisos: { include: { permiso: true } } }
            });

            if (!rol) {
                rol = await prisma.roles.findFirst({
                    where: { nombre_rol: { contains: name } },
                    include: { roles_permisos: { include: { permiso: true } } }
                });
            }

            if (!rol) return res.json({ modulos: [] });
            res.json({ modulos: (rol as any).roles_permisos.map((rp: any) => rp.permiso?.descripcion || ''), nombre_rol: rol.nombre_rol });
        } catch (e) {
            res.status(500).json({ error: 'Error.' });
        }
    }
}
