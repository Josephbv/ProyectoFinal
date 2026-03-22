import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';

const router = Router();

// GET /api/agendamiento
router.get('/', async (_req: Request, res: Response) => {
    try {
        const agendamientos = await prisma.agendamiento.findMany({
            include: {
                cliente: true,
                empleado: true,
                agendamiento_servicios: {
                    include: { servicio: true }
                }
            },
            orderBy: [{ fecha: 'asc' }, { hora: 'asc' }]
        });
        res.json(agendamientos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener agendamientos' });
    }
});

// GET /api/agendamiento/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const id_agendamiento = parseInt(req.params.id as string);
        const cita = await prisma.agendamiento.findUnique({
            where: { id_agendamiento },
            include: {
                cliente: true,
                empleado: true,
                agendamiento_servicios: {
                    include: { servicio: true }
                }
            }
        });
        if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });
        res.json(cita);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener la cita' });
    }
});

// POST /api/agendamiento
router.post('/', async (req: Request, res: Response) => {
    try {
        const { id_cliente, id_empleado, fecha, hora, agendamiento_servicios } = req.body;

        if (!id_cliente || !id_empleado) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        const parseHora = (h: any) => {
            if (!h) return null;
            if (h instanceof Date) return h;
            const date = new Date();
            // Si es un formato HH:mm o HH:mm:ss
            if (typeof h === 'string' && h.includes(':')) {
                const parts = h.split(':');
                date.setHours(parseInt(parts[0]), parseInt(parts[1]), 0, 0);
            } else {
                // Si es un ISO string o similar
                const d = new Date(h);
                if (!isNaN(d.getTime())) {
                    date.setHours(d.getHours(), d.getMinutes(), 0, 0);
                }
            }
            return date;
        };

        const empleadoObj = await prisma.empleado.findUnique({ where: { id_empleado: parseInt(id_empleado as string) } });
        if (!empleadoObj) return res.status(404).json({ error: 'Empleado no encontrado' });

        if (empleadoObj.cedula !== '1001780874' && fecha && hora) {
            const inputFecha = new Date(fecha);
            const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            // Validamos que inputFecha sea válida.
            if (!isNaN(inputFecha.getTime())) {
                const diaStr = diasSemana[inputFecha.getUTCDay()];

                const horarioObj = await prisma.horario.findFirst({
                    where: {
                        id_empleado: parseInt(id_empleado as string),
                        dia_semana: diaStr,
                        disponible: true
                    }
                });

                if (!horarioObj) {
                    return res.status(400).json({ error: `El profesional no atiende los días ${diaStr}.` });
                }

                const inputHora = parseHora(hora);
                if (inputHora && horarioObj.hora_inicio && horarioObj.hora_fin) {
                    const minInicio = horarioObj.hora_inicio.getUTCHours() * 60 + horarioObj.hora_inicio.getUTCMinutes();
                    const minFin = horarioObj.hora_fin.getUTCHours() * 60 + horarioObj.hora_fin.getUTCMinutes();
                    const minInput = inputHora.getHours() * 60 + inputHora.getMinutes();

                    if (minInput < minInicio || minInput > minFin) {
                        const formatH = (h: Date) => `${h.getUTCHours().toString().padStart(2, '0')}:${h.getUTCMinutes().toString().padStart(2, '0')}`;
                        return res.status(400).json({
                            error: `La hora seleccionada está fuera del horario laboral del profesional (${formatH(horarioObj.hora_inicio)} a ${formatH(horarioObj.hora_fin)}).`
                        });
                    }
                }
            }
        }

        const nuevaCita = await prisma.agendamiento.create({
            data: {
                id_cliente: parseInt(id_cliente as string),
                id_empleado: parseInt(id_empleado as string),
                fecha: fecha ? new Date(fecha) : null,
                hora: hora ? parseHora(hora) : null,
                agendamiento_servicios: {
                    create: (agendamiento_servicios || []).map((serv: any) => ({
                        id_servicio: parseInt(serv.id_servicio as string)
                    }))
                }
            },
            include: {
                cliente: true,
                empleado: true,
                agendamiento_servicios: { include: { servicio: true } }
            }
        });

        res.status(201).json(nuevaCita);
    } catch (error) {
        console.error('[AGENDAMIENTO] ERROR CREATE:', error);
        res.status(500).json({ error: 'Error al crear la cita' });
    }
});

// PUT /api/agendamiento/:id
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const id_agendamiento = parseInt(req.params.id as string);
        const { id_cliente, id_empleado, fecha, hora, agendamiento_servicios } = req.body;

        const parseHora = (h: any) => {
            if (!h) return null;
            if (h instanceof Date) return h;
            const date = new Date();
            if (typeof h === 'string' && h.includes(':')) {
                const parts = h.split(':');
                date.setHours(parseInt(parts[0]), parseInt(parts[1]), 0, 0);
            } else {
                const d = new Date(h);
                if (!isNaN(d.getTime())) {
                    date.setHours(d.getHours(), d.getMinutes(), 0, 0);
                }
            }
            return date;
        };

        const updateData: any = {};
        if (id_cliente) updateData.id_cliente = parseInt(id_cliente as string);
        if (id_empleado) updateData.id_empleado = parseInt(id_empleado as string);
        if (fecha) updateData.fecha = new Date(fecha);
        if (hora) updateData.hora = parseHora(hora);

        // Validar si id_empleado es modificado o si ya existe.
        const targetEmpleadoId = id_empleado ? parseInt(id_empleado as string) : null;
        if (targetEmpleadoId && (updateData.fecha || updateData.hora)) {
            const empleadoObj = await prisma.empleado.findUnique({ where: { id_empleado: targetEmpleadoId } });
            if (empleadoObj && empleadoObj.cedula !== '1001780874') {
                const targetFecha = updateData.fecha; // Ya es Date
                if (targetFecha && !isNaN(targetFecha.getTime()) && updateData.hora) {
                    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                    const diaStr = diasSemana[targetFecha.getUTCDay()];

                    const horarioObj = await prisma.horario.findFirst({
                        where: {
                            id_empleado: targetEmpleadoId,
                            dia_semana: diaStr,
                            disponible: true
                        }
                    });

                    if (!horarioObj) {
                        return res.status(400).json({ error: `El profesional no atiende los días ${diaStr}.` });
                    }

                    if (horarioObj.hora_inicio && horarioObj.hora_fin && updateData.hora) {
                        const minInicio = horarioObj.hora_inicio.getUTCHours() * 60 + horarioObj.hora_inicio.getUTCMinutes();
                        const minFin = horarioObj.hora_fin.getUTCHours() * 60 + horarioObj.hora_fin.getUTCMinutes();
                        const inputHoraReal = updateData.hora;
                        const minInput = inputHoraReal.getHours() * 60 + inputHoraReal.getMinutes();

                        if (minInput < minInicio || minInput > minFin) {
                            const formatH = (h: Date) => `${h.getUTCHours().toString().padStart(2, '0')}:${h.getUTCMinutes().toString().padStart(2, '0')}`;
                            return res.status(400).json({
                                error: `La hora seleccionada está fuera del horario laboral del profesional (${formatH(horarioObj.hora_inicio)} a ${formatH(horarioObj.hora_fin)}).`
                            });
                        }
                    }
                }
            }
        }

        // Actualizar agendamiento
        const actualizada = await prisma.agendamiento.update({
            where: { id_agendamiento },
            data: updateData
        });

        // Actualizar servicios asociados si se proveen
        if (agendamiento_servicios && Array.isArray(agendamiento_servicios)) {
            // Eliminar servicios actuales
            await prisma.agendamiento_servicios.deleteMany({
                where: { id_agendamiento }
            });
            // Insertar nuevos
            if (agendamiento_servicios.length > 0) {
                await prisma.agendamiento_servicios.createMany({
                    data: agendamiento_servicios.map((serv: any) => ({
                        id_agendamiento,
                        id_servicio: parseInt(serv.id_servicio as string)
                    }))
                });
            }
        }

        const citaFull = await prisma.agendamiento.findUnique({
            where: { id_agendamiento },
            include: {
                cliente: true,
                empleado: true,
                agendamiento_servicios: { include: { servicio: true } }
            }
        });

        res.json(citaFull);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar la cita' });
    }
});

// DELETE /api/agendamiento/:id
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const id_agendamiento = parseInt(req.params.id as string);

        // Use transaction to delete child records before parent
        await prisma.$transaction([
            prisma.agendamiento_servicios.deleteMany({ where: { id_agendamiento } }),
            prisma.agendamiento.delete({ where: { id_agendamiento } })
        ]);

        res.json({ success: true, message: 'Cita eliminada correctamente' });
    } catch (error) {
        console.error('[AGENDAMIENTO] ERROR AL ELIMINAR:', error);
        res.status(500).json({ error: 'Error al eliminar la cita' });
    }
});

export default router;
