"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgendamientoController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const parseHora = (h) => {
    if (!h)
        return null;
    if (h instanceof Date)
        return h;
    const date = new Date();
    if (typeof h === 'string' && h.includes(':')) {
        const parts = h.split(':');
        date.setHours(parseInt(parts[0]), parseInt(parts[1]), 0, 0);
    }
    else {
        const d = new Date(h);
        if (!isNaN(d.getTime())) {
            date.setHours(d.getHours(), d.getMinutes(), 0, 0);
        }
    }
    return date;
};
class AgendamientoController {
    static async getAgendamientos(_req, res) {
        try {
            const agendamientos = await prisma_1.default.agendamiento.findMany({
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
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener agendamientos' });
        }
    }
    static async getAgendamientoById(req, res) {
        try {
            const id_agendamiento = parseInt(req.params.id);
            const cita = await prisma_1.default.agendamiento.findUnique({
                where: { id_agendamiento },
                include: {
                    cliente: true,
                    empleado: true,
                    agendamiento_servicios: {
                        include: { servicio: true }
                    }
                }
            });
            if (!cita)
                return res.status(404).json({ error: 'Cita no encontrada' });
            res.json(cita);
        }
        catch (error) {
            res.status(500).json({ error: 'Error al obtener la cita' });
        }
    }
    static async createAgendamiento(req, res) {
        try {
            const { id_cliente, id_empleado, fecha, hora, agendamiento_servicios } = req.body;
            if (!id_cliente || !id_empleado) {
                return res.status(400).json({ error: 'Faltan campos obligatorios' });
            }
            const empleadoObj = await prisma_1.default.empleado.findUnique({ where: { id_empleado: parseInt(id_empleado) } });
            if (!empleadoObj)
                return res.status(404).json({ error: 'Empleado no encontrado' });
            if (empleadoObj.cedula !== '1001780874' && fecha && hora) {
                const inputFecha = new Date(fecha);
                const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                if (!isNaN(inputFecha.getTime())) {
                    const diaStr = diasSemana[inputFecha.getUTCDay()];
                    const horarioObj = await prisma_1.default.horario.findFirst({
                        where: {
                            id_empleado: parseInt(id_empleado),
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
                            const formatH = (h) => `${h.getUTCHours().toString().padStart(2, '0')}:${h.getUTCMinutes().toString().padStart(2, '0')}`;
                            return res.status(400).json({
                                error: `La hora seleccionada está fuera del horario laboral del profesional (${formatH(horarioObj.hora_inicio)} a ${formatH(horarioObj.hora_fin)}).`
                            });
                        }
                    }
                }
            }
            const nuevaCita = await prisma_1.default.agendamiento.create({
                data: {
                    id_cliente: parseInt(id_cliente),
                    id_empleado: parseInt(id_empleado),
                    fecha: fecha ? new Date(fecha) : null,
                    hora: hora ? parseHora(hora) : null,
                    agendamiento_servicios: {
                        create: (agendamiento_servicios || []).map((serv) => ({
                            id_servicio: parseInt(serv.id_servicio)
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
        }
        catch (error) {
            console.error('[AGENDAMIENTO] ERROR CREATE:', error);
            res.status(500).json({ error: 'Error al crear la cita' });
        }
    }
    static async updateAgendamiento(req, res) {
        try {
            const id_agendamiento = parseInt(req.params.id);
            const { id_cliente, id_empleado, fecha, hora, agendamiento_servicios, estado } = req.body;
            const updateData = {};
            if (id_cliente)
                updateData.id_cliente = parseInt(id_cliente);
            if (id_empleado)
                updateData.id_empleado = parseInt(id_empleado);
            if (fecha)
                updateData.fecha = new Date(fecha);
            if (hora)
                updateData.hora = parseHora(hora);
            if (estado)
                updateData.estado = estado;
            const targetEmpleadoId = id_empleado ? parseInt(id_empleado) : null;
            if (targetEmpleadoId && (updateData.fecha || updateData.hora)) {
                const empleadoObj = await prisma_1.default.empleado.findUnique({ where: { id_empleado: targetEmpleadoId } });
                if (empleadoObj && empleadoObj.cedula !== '1001780874') {
                    const targetFecha = updateData.fecha;
                    if (targetFecha && !isNaN(targetFecha.getTime()) && updateData.hora) {
                        const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                        const diaStr = diasSemana[targetFecha.getUTCDay()];
                        const horarioObj = await prisma_1.default.horario.findFirst({
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
                            const minInput = updateData.hora.getHours() * 60 + updateData.hora.getMinutes();
                            if (minInput < minInicio || minInput > minFin) {
                                const formatH = (h) => `${h.getUTCHours().toString().padStart(2, '0')}:${h.getUTCMinutes().toString().padStart(2, '0')}`;
                                return res.status(400).json({
                                    error: `La hora seleccionada está fuera del horario laboral del profesional (${formatH(horarioObj.hora_inicio)} a ${formatH(horarioObj.hora_fin)}).`
                                });
                            }
                        }
                    }
                }
            }
            await prisma_1.default.agendamiento.update({
                where: { id_agendamiento },
                data: {
                    id_cliente: updateData.id_cliente,
                    id_empleado: updateData.id_empleado,
                    fecha: updateData.fecha,
                    hora: updateData.hora
                }
            });
            if (updateData.estado) {
                try {
                    await prisma_1.default.$executeRawUnsafe(`UPDATE agendamiento SET estado = '${updateData.estado}' WHERE id_agendamiento = ${id_agendamiento}`);
                }
                catch (rawError) {
                    console.error('[AGENDAMIENTO] RAW SQL ERROR:', rawError);
                }
            }
            if (agendamiento_servicios && Array.isArray(agendamiento_servicios)) {
                await prisma_1.default.agendamiento_servicios.deleteMany({ where: { id_agendamiento } });
                if (agendamiento_servicios.length > 0) {
                    await prisma_1.default.agendamiento_servicios.createMany({
                        data: agendamiento_servicios.map((serv) => ({
                            id_agendamiento,
                            id_servicio: parseInt(serv.id_servicio)
                        }))
                    });
                }
            }
            const citaFull = await prisma_1.default.agendamiento.findUnique({
                where: { id_agendamiento },
                include: {
                    cliente: true,
                    empleado: true,
                    agendamiento_servicios: { include: { servicio: true } }
                }
            });
            res.json(citaFull);
        }
        catch (error) {
            res.status(500).json({ error: 'Error al actualizar la cita' });
        }
    }
    static async deleteAgendamiento(req, res) {
        try {
            const id_agendamiento = parseInt(req.params.id);
            await prisma_1.default.$transaction([
                prisma_1.default.agendamiento_servicios.deleteMany({ where: { id_agendamiento } }),
                prisma_1.default.agendamiento.delete({ where: { id_agendamiento } })
            ]);
            res.json({ success: true, message: 'Cita eliminada correctamente' });
        }
        catch (error) {
            console.error('[AGENDAMIENTO] ERROR AL ELIMINAR:', error);
            res.status(500).json({ error: 'Error al eliminar la cita' });
        }
    }
}
exports.AgendamientoController = AgendamientoController;
