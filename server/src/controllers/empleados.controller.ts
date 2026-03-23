import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendWelcomeEmail } from '../services/mail.service';

export class EmpleadosController {
    static async getEmpleados(_req: Request, res: Response) {
        try {
            const empleados = await prisma.empleado.findMany({
                include: { horarios: true }
            });
            res.json(empleados);
        } catch (error) {
            res.status(500).json({ error: 'Error al obtener empleados' });
        }
    }

    static async getEmpleadoById(req: Request, res: Response) {
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
    }

    static async createEmpleado(req: Request, res: Response) {
        try {
            const {
                nombre, tipo_documento, cedula, correo,
                telefono, direccion, cargo, profesion,
                especialidad, observaciones, experiencia
            } = req.body;

            if (!nombre || !cedula || !correo) {
                return res.status(400).json({ error: 'El nombre, la cédula y el correo son obligatorios' });
            }

            const duplicadoCedula = await prisma.empleado.findUnique({ where: { cedula } });
            if (duplicadoCedula) return res.status(400).json({ error: 'Ya existe un empleado con esa cédula' });

            const duplicadoCorreo = await prisma.empleado.findUnique({ where: { correo } });
            if (duplicadoCorreo) return res.status(400).json({ error: 'Ya existe un empleado con ese correo' });

            const nuevoEmpleado = await prisma.$transaction(async (tx) => {
                let rol = await tx.roles.findFirst({
                    where: { nombre_rol: { contains: cargo || 'Veterinario' } }
                });

                if (!rol) {
                    rol = await tx.roles.findFirst({ where: { nombre_rol: 'Veterinario' } });
                    if (!rol) {
                        rol = await tx.roles.create({ data: { nombre_rol: 'Veterinario', activo: true } });
                    }
                }

                let usuarioVinculado = await tx.usuario.findFirst({
                    where: { OR: [{ correo }, { cedula }] }
                });

                if (usuarioVinculado) {
                    await tx.usuario.update({
                        where: { id_usuario: usuarioVinculado.id_usuario },
                        data: { id_rol: rol.id_rol }
                    });
                } else {
                    const tokenActivacion = Math.random().toString(36).substring(7);

                    usuarioVinculado = await tx.usuario.create({
                        data: {
                            nombre_usuario: nombre,
                            correo: correo,
                            cedula: cedula,
                            contrasena: '$2a$10$76YmPvtHqYp.p/f.wzY.Ou6mR.e1kX.H.r1kX.H.r1kX.H.r1kX.H',
                            id_rol: rol.id_rol,
                            activo: true,
                            token_recuperacion: tokenActivacion
                        }
                    });
                }

                const empleadoArr = await tx.empleado.create({
                    data: {
                        nombre, tipo_documento, cedula, correo,
                        telefono, direccion, cargo, profesion,
                        especialidad, observaciones,
                        experiencia: experiencia || null
                    }
                });

                await tx.usuario.update({
                    where: { id_usuario: usuarioVinculado.id_usuario },
                    data: { id_empleado: empleadoArr.id_empleado }
                });

                return { empleado: empleadoArr, usuario: usuarioVinculado };
            });

            if (nuevoEmpleado.usuario?.token_recuperacion) {
                sendWelcomeEmail(
                    correo,
                    nombre,
                    nuevoEmpleado.usuario.token_recuperacion
                ).catch(err => console.error('[MAIL-W-ASYNC] Error:', err));
            }

            res.status(201).json(nuevoEmpleado.empleado);
        } catch (error: any) {
            console.error('[EMPLEADOS] ERROR:', error);
            res.status(500).json({ error: error.message || 'Error al crear el empleado' });
        }
    }

    static async updateEmpleado(req: Request, res: Response) {
        try {
            const id_empleado = parseInt(req.params.id as string);
            const {
                nombre, tipo_documento, cedula, correo,
                telefono, direccion, cargo, profesion,
                especialidad, observaciones, experiencia
            } = req.body;

            const actualizado = await prisma.empleado.update({
                where: { id_empleado },
                data: {
                    nombre, tipo_documento, cedula, correo,
                    telefono, direccion, cargo, profesion,
                    especialidad, observaciones,
                    experiencia: experiencia !== undefined ? (experiencia || null) : undefined
                }
            });

            const emp = await prisma.empleado.findUnique({
                where: { id_empleado },
                include: { usuarios: true }
            });

            if (emp?.usuarios && emp.usuarios.length > 0) {
                const user = emp.usuarios[0];
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
    }

    static async deleteEmpleado(req: Request, res: Response) {
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

            if (emp.correo === 'josephballestas10@gmail.com' || emp.cedula === '1001780874') {
                return res.status(403).json({ error: 'No se puede eliminar al Administrador Principal del sistema.' });
            }

            await prisma.$transaction(async (tx) => {
                const idsAgendamientos = emp.agendaciones.map(a => a.id_agendamiento);
                if (idsAgendamientos.length > 0) {
                    await tx.agendamiento_servicios.deleteMany({
                        where: { id_agendamiento: { in: idsAgendamientos } }
                    });
                }

                await tx.agendamiento.deleteMany({
                    where: { id_empleado }
                });

                await tx.horario.deleteMany({
                    where: { id_empleado }
                });

                if (emp.usuarios && emp.usuarios.length > 0) {
                    for (const u of emp.usuarios) {
                        const userFull = await tx.usuario.findUnique({
                            where: { id_usuario: u.id_usuario },
                            include: { rol: true }
                        });

                        const roleName = (userFull?.rol?.nombre_rol || '').toLowerCase();

                        if (roleName.includes('administrador')) {
                            await tx.usuario.update({
                                where: { id_usuario: u.id_usuario },
                                data: { id_empleado: null }
                            });
                        } else {
                            await tx.usuario.delete({ where: { id_usuario: u.id_usuario } });
                        }
                    }
                }

                await tx.empleado.delete({
                    where: { id_empleado }
                });
            });

            res.status(204).send();
        } catch (error: any) {
            console.error('[EMPLEADOS] DELETE ERROR:', error);
            res.status(500).json({ error: error.message || 'Error al eliminar el empleado' });
        }
    }
}
