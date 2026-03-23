import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendWelcomeEmail } from '../services/mail.service';
import crypto from 'crypto';

export class ClientesController {
    static async getClientes(_req: Request, res: Response) {
        try {
            const clientes = await prisma.cliente.findMany({
                include: { mascotas: true },
            });
            res.json(clientes);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener clientes' });
        }
    }

    static async getClienteById(req: Request, res: Response) {
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
    }

    static async createCliente(req: Request, res: Response) {
        console.log('[CLIENTES] Petición POST recibida:', req.body);
        try {
            const { nombre, tipo_documento, cedula, telefono, correo, direccion } = req.body;

            if (!nombre || !tipo_documento || !cedula || !telefono || !direccion || !correo) {
                return res.status(400).json({ error: 'Nombre, tipo de documento, documento, teléfono, dirección y email son obligatorios.' });
            }

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

            const nuevoCliente = await prisma.cliente.create({
                data: { nombre, tipo_documento, cedula, telefono, correo, direccion },
                include: { mascotas: true },
            });

            const tokenActivacion = crypto.randomUUID();

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
                            contrasena: '',
                            token_recuperacion: tokenActivacion,
                            id_rol: rolCliente ? rolCliente.id_rol : 4,
                            id_cliente: nuevoCliente.id_cliente,
                            activo: true
                        }
                    });
                } else if (existeUserCorreo) {
                    await prisma.usuario.update({
                        where: { correo },
                        data: {
                            token_recuperacion: tokenActivacion,
                            id_cliente: nuevoCliente.id_cliente
                        }
                    });
                }

                sendWelcomeEmail(correo, nombre, tokenActivacion).catch(err =>
                    console.error('[CLIENTES] Error asíncrono enviando bienvenida:', err)
                );

            } catch (usuarioError) {
                console.error('[CLIENTES] Error en proceso de usuario/email:', usuarioError);
            }

            res.status(201).json(nuevoCliente);
        } catch (error) {
            console.error('[CLIENTES] ERROR CRÍTICO AL CREAR:', error);
            res.status(500).json({ error: 'Error al crear el cliente.' });
        }
    }

    static async updateCliente(req: Request, res: Response) {
        try {
            const id_cliente = parseInt(req.params.id as string);
            const { nombre, tipo_documento, cedula, telefono, correo, direccion } = req.body;

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
                include: { mascotas: true, usuarios: true },
            });

            if (actualizado.usuarios && actualizado.usuarios.length > 0) {
                await prisma.usuario.update({
                    where: { id_usuario: actualizado.usuarios[0].id_usuario },
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
    }

    static async deleteCliente(req: Request, res: Response) {
        try {
            const id_cliente = parseInt(req.params.id as string);

            await prisma.$transaction(async (tx) => {
                const agendamientos = await tx.agendamiento.findMany({
                    where: { id_cliente },
                    select: { id_agendamiento: true }
                });
                const idsAgendamientos = agendamientos.map(a => a.id_agendamiento);

                if (idsAgendamientos.length > 0) {
                    await tx.agendamiento_servicios.deleteMany({
                        where: { id_agendamiento: { in: idsAgendamientos } }
                    });
                }

                await tx.agendamiento.deleteMany({
                    where: { id_cliente }
                });

                const ventas = await tx.ventas.findMany({
                    where: { id_cliente },
                    select: { id_venta: true }
                });
                const idsVentas = ventas.map(v => v.id_venta);

                if (idsVentas.length > 0) {
                    await tx.venta_servicios.deleteMany({
                        where: { id_venta: { in: idsVentas } }
                    });
                }

                await tx.ventas.deleteMany({
                    where: { id_cliente }
                });

                const mascotas = await tx.mascotas.findMany({
                    where: { id_cliente },
                    select: { id_mascota: true }
                });
                const idsMascotas = mascotas.map(m => m.id_mascota);

                if (idsMascotas.length > 0) {
                    await tx.historial_mascotas.deleteMany({
                        where: { id_mascota: { in: idsMascotas } }
                    });
                }

                await tx.mascotas.deleteMany({
                    where: { id_cliente }
                });

                await tx.usuario.deleteMany({
                    where: { id_cliente }
                });

                await tx.cliente.delete({
                    where: { id_cliente }
                });
            });

            res.json({ success: true, message: 'Cliente y toda su información relacionada eliminados correctamente' });
        } catch (error) {
            console.error('[CLIENTES] ERROR AL ELIMINAR:', error);
            res.status(500).json({ error: 'Error al eliminar el cliente y sus datos relacionados' });
        }
    }
}
