import { Router, Request, Response } from 'express';
import prisma from '../prismaClient';

const router = Router();

// GET /api/clientes - Obtener todos los clientes con sus mascotas
router.get('/', async (_req: Request, res: Response) => {
    try {
        const clientes = await prisma.cliente.findMany({
            include: { mascotas: true },
        });
        res.json(clientes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener clientes' });
    }
});

// GET /api/clientes/:id - Obtener un cliente por ID
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const id_cliente = parseInt(req.params.id as string);
        const cliente = await prisma.cliente.findUnique({
            where: { id_cliente },
            include: { mascotas: true },
        });
        if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
        res.json(cliente);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el cliente' });
    }
});

// POST /api/clientes - Crear un nuevo cliente
router.post('/', async (req: Request, res: Response) => {
    console.log('[CLIENTES] Petición POST recibida:', req.body);
    try {
        const { nombre, tipo_documento, cedula, telefono, correo, direccion } = req.body;

        // Validaciones de obligatoriedad
        if (!nombre || !tipo_documento || !cedula || !telefono || !direccion || !correo) {
            console.log('[CLIENTES] ERROR: Faltan campos obligatorios');
            return res.status(400).json({ error: 'Nombre, tipo de documento, documento, teléfono, dirección y email son obligatorios.' });
        }

        // Validación de duplicados en tabla cliente
        const duplicadoDocumento = await prisma.cliente.findUnique({ where: { cedula } });
        if (duplicadoDocumento) {
            return res.status(400).json({ error: 'Ya existe un cliente con ese documento.' });
        }
        const duplicadoCorreo = await prisma.cliente.findUnique({ where: { correo } });
        if (duplicadoCorreo) {
            return res.status(400).json({ error: 'Ya existe un cliente con ese correo.' });
        }
        const duplicadoNombre = await prisma.cliente.findFirst({ where: { nombre: { equals: nombre } } });
        if (duplicadoNombre) {
            return res.status(400).json({ error: 'Ya existe un cliente registrado con ese nombre.' });
        }

        // 1. Crear el cliente (sin usuario anidado para mayor confiabilidad)
        const nuevoCliente = await prisma.cliente.create({
            data: { nombre, tipo_documento, cedula, telefono, correo, direccion },
            include: { mascotas: true },
        });

        // 2. Intentar crear el usuario vinculado (no crítico: si falla, el cliente igual queda creado)
        try {
            let rolCliente = await prisma.roles.findFirst({
                where: { nombre_rol: { contains: 'cliente' } }
            });
            if (!rolCliente) {
                rolCliente = await prisma.roles.create({
                    data: { nombre_rol: 'cliente', activo: true }
                });
            }
            const existeUserCedula = cedula ? await prisma.usuario.findUnique({ where: { cedula } }) : null;
            const existeUserCorreo = correo ? await prisma.usuario.findUnique({ where: { correo } }) : null;
            if (!existeUserCedula && !existeUserCorreo) {
                await prisma.usuario.create({
                    data: {
                        nombre_usuario: nombre,
                        correo,
                        cedula,
                        contrasena: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
                        id_rol: rolCliente.id_rol,
                        id_cliente: nuevoCliente.id_cliente,
                        activo: true
                    }
                });
            }
        } catch (usuarioError) {
            console.warn('[CLIENTES] Usuario vinculado no creado (no crítico):', usuarioError);
        }

        console.log('[CLIENTES] Creado con éxito:', nuevoCliente.id_cliente);
        res.status(201).json(nuevoCliente);
    } catch (error) {
        console.error('[CLIENTES] ERROR CRÍTICO AL CREAR:', error);
        res.status(500).json({ error: 'Error al crear el cliente.' });
    }
});


// PUT /api/clientes/:id - Actualizar un cliente
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const id_cliente = parseInt(req.params.id as string);
        const { nombre, tipo_documento, cedula, telefono, correo, direccion } = req.body;

        // Verificamos si el correo o cédula que se quiere actualizar ya existen en OTRO cliente
        if (cedula) {
            const existeCedula = await prisma.cliente.findFirst({
                where: { cedula, NOT: { id_cliente } }
            });
            if (existeCedula) return res.status(400).json({ error: 'Ya existe ese documento.' });
        }

        if (correo) {
            const existeCorreo = await prisma.cliente.findFirst({
                where: { correo, NOT: { id_cliente } }
            });
            if (existeCorreo) return res.status(400).json({ error: 'El usuario ya tiene ese correo.' });
        }

        const actualizado = await prisma.cliente.update({
            where: { id_cliente },
            data: {
                nombre,
                tipo_documento,
                cedula,
                telefono,
                correo,
                direccion
            },
            include: { mascotas: true, usuario: true },
        });

        // Opcionalmente actualizar los datos en la tabla usuario si están vinculados
        if (actualizado.usuario) {
            await prisma.usuario.update({
                where: { id_usuario: actualizado.usuario.id_usuario },
                data: {
                    nombre_usuario: nombre,
                    correo: correo,
                    cedula: cedula
                }
            });
        }

        res.json(actualizado);
    } catch (error) {
        console.error('[CLIENTES] ERROR AL ACTUALIZAR:', error);
        res.status(500).json({ error: 'Error al actualizar el cliente' });
    }
});

// DELETE /api/clientes/:id - Eliminar un cliente (Borrado en cascada manual para integridad)
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const id_cliente = parseInt(req.params.id as string);

        // Usamos una transacción para asegurar que todo se borre o nada se borre
        await prisma.$transaction(async (tx) => {
            // 1. Obtener los IDs de agendamientos del cliente
            const agendamientos = await tx.agendamiento.findMany({
                where: { id_cliente },
                select: { id_agendamiento: true }
            });
            const idsAgendamientos = agendamientos.map(a => a.id_agendamiento);

            // 2. Borrar agendamiento_servicios (registros hijos de los agendamientos)
            if (idsAgendamientos.length > 0) {
                await tx.agendamiento_servicios.deleteMany({
                    where: { id_agendamiento: { in: idsAgendamientos } }
                });
            }

            // 3. Borrar los agendamientos del cliente
            await tx.agendamiento.deleteMany({
                where: { id_cliente }
            });

            // 4. Obtener los IDs de ventas del cliente
            const ventas = await tx.ventas.findMany({
                where: { id_cliente },
                select: { id_venta: true }
            });
            const idsVentas = ventas.map(v => v.id_venta);

            // 5. Borrar venta_servicios (registros hijos de las ventas)
            if (idsVentas.length > 0) {
                await tx.venta_servicios.deleteMany({
                    where: { id_venta: { in: idsVentas } }
                });
            }

            // 6. Borrar las ventas del cliente
            await tx.ventas.deleteMany({
                where: { id_cliente }
            });

            // 7. Obtener mascotas para borrar sus historiales
            const mascotas = await tx.mascotas.findMany({
                where: { id_cliente },
                select: { id_mascota: true }
            });
            const idsMascotas = mascotas.map(m => m.id_mascota);

            // 8. Borrar historial_mascotas
            if (idsMascotas.length > 0) {
                await tx.historial_mascotas.deleteMany({
                    where: { id_mascota: { in: idsMascotas } }
                });
            }

            // 9. Borrar las mascotas del cliente
            await tx.mascotas.deleteMany({
                where: { id_cliente }
            });

            // 10. Borrar el usuario asociado al cliente (si existe)
            await tx.usuario.deleteMany({
                where: { id_cliente }
            });

            // 11. Finalmente borrar el cliente
            await tx.cliente.delete({
                where: { id_cliente }
            });
        });

        res.json({ success: true, message: 'Cliente y toda su información relacionada eliminados correctamente' });
    } catch (error) {
        console.error('[CLIENTES] ERROR AL ELIMINAR:', error);
        res.status(500).json({ error: 'Error al eliminar el cliente y sus datos relacionados' });
    }
});

export default router;
