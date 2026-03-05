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
            // 1. Buscar el rol adecuado (Veterinario, Recepcionista, etc. o por defecto empleado)
            let rol = await tx.roles.findFirst({
                where: { nombre_rol: { contains: cargo || 'empleado' } }
            });

            if (!rol) {
                rol = await tx.roles.findFirst({ where: { nombre_rol: 'empleado' } });
                if (!rol) {
                    rol = await tx.roles.create({ data: { nombre_rol: 'empleado', activo: true } });
                }
            }

            // 2. Crear usuario vinculado
            const nuevoUsuario = await tx.usuario.create({
                data: {
                    nombre_usuario: nombre,
                    correo: correo,
                    cedula: cedula,
                    contrasena: '$2a$10$76YmPvtHqYp.p/f.wzY.Ou6mR.e1kX.H.r1kX.H.r1kX.H.r1kX.H', // password123
                    id_rol: rol.id_rol,
                    activo: true
                }
            });

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
                where: { id_usuario: nuevoUsuario.id_usuario },
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
            include: { usuario: true }
        });

        if (emp?.usuario) {
            await prisma.usuario.update({
                where: { id_usuario: emp.usuario.id_usuario },
                data: {
                    nombre_usuario: nombre,
                    correo: correo,
                    cedula: cedula
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

        // El borrado del empleado debe ser cuidadoso si tiene usuario vinculado
        const emp = await prisma.empleado.findUnique({
            where: { id_empleado },
            include: { usuario: true }
        });

        await prisma.$transaction(async (tx) => {
            if (emp?.usuario) {
                await tx.usuario.delete({ where: { id_usuario: emp.usuario.id_usuario } });
            }
            await tx.empleado.delete({ where: { id_empleado } });
        });

        res.status(204).send();
    } catch (error) {
        console.error('[EMPLEADOS] DELETE ERROR:', error);
        res.status(500).json({ error: 'Error al eliminar el empleado' });
    }
});

export default router;
