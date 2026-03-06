import { Router, Request, Response } from 'express';
import prisma from '../prismaClient';

const router = Router();

// GET /api/empleados
router.get('/', async (_req: Request, res: Response) => {
    try {
        const empleados = await prisma.empleado.findMany({
            include: { horarios: true }
        });
        res.json(empleados);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener empleados' });
    }
});

// GET /api/empleados/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const id_empleado = parseInt(req.params.id as string);
        const empleado = await prisma.empleado.findUnique({
            where: { id_empleado },
            include: { horarios: true }
        });
        if (!empleado) return res.status(404).json({ error: 'Empleado no encontrado' });
        res.json(empleado);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el empleado' });
    }
});

// POST /api/empleados
router.post('/', async (req: Request, res: Response) => {
    try {
        const {
            nombre, tipo_documento, cedula, correo,
            telefono, direccion, cargo, profesion,
            especialidad, observaciones
        } = req.body;

        if (!nombre || !cedula || !correo) {
            return res.status(400).json({ error: 'El nombre, la cédula y el correo son obligatorios' });
        }

        // Validación de duplicados
        const duplicadoCedula = await prisma.empleado.findUnique({ where: { cedula } });
        if (duplicadoCedula) return res.status(400).json({ error: 'Ya existe un empleado con esa cédula' });

        const duplicadoCorreo = await prisma.empleado.findUnique({ where: { correo } });
        if (duplicadoCorreo) return res.status(400).json({ error: 'Ya existe un empleado con ese correo' });

        const nuevoEmpleado = await prisma.$transaction(async (tx) => {
            // 1. Buscar el rol adecuado (Veterinario, etc.)
            let rol = await tx.roles.findFirst({
                where: { nombre_rol: { contains: cargo || 'Veterinario' } }
            });

            if (!rol) {
                rol = await tx.roles.findFirst({ where: { nombre_rol: 'Veterinario' } });
                if (!rol) {
                    rol = await tx.roles.create({ data: { nombre_rol: 'Veterinario', activo: true } });
                }
            }

            // 2. Buscar o crear usuario vinculado
            let usuarioVinculado = await tx.usuario.findFirst({
                where: { OR: [{ correo }, { cedula }] }
            });

            if (usuarioVinculado) {
                // Actualizar rol si ya existe
                await tx.usuario.update({
                    where: { id_usuario: usuarioVinculado.id_usuario },
                    data: { id_rol: rol.id_rol }
                });
            } else {
                usuarioVinculado = await tx.usuario.create({
                    data: {
                        nombre_usuario: nombre,
                        correo: correo,
                        cedula: cedula,
                        contrasena: '$2a$10$76YmPvtHqYp.p/f.wzY.Ou6mR.e1kX.H.r1kX.H.r1kX.H.r1kX.H', // password123
                        id_rol: rol.id_rol,
                        activo: true
                    }
                });
            }

            // 3. Crear empleado
            const empleadoArr = await tx.empleado.create({
                data: {
                    nombre, tipo_documento, cedula, correo,
                    telefono, direccion, cargo, profesion,
                    especialidad, observaciones
                }
            });

            // 4. Vincular usuario al empleado recién creado
            await tx.usuario.update({
                where: { id_usuario: usuarioVinculado.id_usuario },
                data: { id_empleado: empleadoArr.id_empleado }
            });

            return empleadoArr;
        });

        res.status(201).json(nuevoEmpleado);
    } catch (error) {
        console.error('[EMPLEADOS] ERROR:', error);
        res.status(500).json({ error: 'Error al crear el empleado' });
    }
});

// PUT /api/empleados/:id
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const id_empleado = parseInt(req.params.id as string);
        const {
            nombre, tipo_documento, cedula, correo,
            telefono, direccion, cargo, profesion,
            especialidad, observaciones
        } = req.body;

        const actualizado = await prisma.empleado.update({
            where: { id_empleado },
            data: {
                nombre, tipo_documento, cedula, correo,
                telefono, direccion, cargo, profesion,
                especialidad, observaciones
            }
        });

        // Actualizar datos en usuario si existe relación
        const emp = await prisma.empleado.findUnique({
            where: { id_empleado },
            include: { usuarios: true }
        });

        if (emp?.usuarios && emp.usuarios.length > 0) {
            const user = emp.usuarios[0];
            // Buscar nuevo rol si el cargo cambió
            let newRolId = user.id_rol;
            if (cargo) {
                const rol = await prisma.roles.findFirst({
                    where: { nombre_rol: { contains: cargo } }
                });
                if (rol) newRolId = rol.id_rol;
            }

            await prisma.usuario.update({
                where: { id_usuario: user.id_usuario },
                data: {
                    nombre_usuario: nombre,
                    correo: correo,
                    cedula: cedula,
                    id_rol: newRolId
                }
            });
        }

        res.json(actualizado);
    } catch (error) {
        console.error('[EMPLEADOS] UPDATE ERROR:', error);
        res.status(500).json({ error: 'Error al actualizar el empleado' });
    }
});

// DELETE /api/empleados/:id
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const id_empleado = parseInt(req.params.id as string);

        const emp = await prisma.empleado.findUnique({
            where: { id_empleado },
            include: {
                usuarios: true,
                agendaciones: {
                    select: { id_agendamiento: true }
                }
            }
        });

        if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' });

        await prisma.$transaction(async (tx) => {
            // 1. Borrar servicios asociados a los agendamientos del empleado
            const idsAgendamientos = emp.agendaciones.map(a => a.id_agendamiento);
            if (idsAgendamientos.length > 0) {
                await tx.agendamiento_servicios.deleteMany({
                    where: { id_agendamiento: { in: idsAgendamientos } }
                });
            }

            // 2. Borrar los agendamientos
            await tx.agendamiento.deleteMany({
                where: { id_empleado }
            });

            // 3. Borrar horarios
            await tx.horario.deleteMany({
                where: { id_empleado }
            });

            // 4. Borrar usuarios vinculados
            if (emp.usuarios && emp.usuarios.length > 0) {
                await tx.usuario.deleteMany({
                    where: { id_empleado }
                });
            }

            // 5. Finalmente borrar el empleado
            await tx.empleado.delete({
                where: { id_empleado }
            });
        });

        res.status(204).send();
    } catch (error) {
        console.error('[EMPLEADOS] DELETE ERROR:', error);
        res.status(500).json({ error: 'Error al eliminar el empleado' });
    }
});

export default router;
