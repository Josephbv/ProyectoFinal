import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';

const router = Router();

// Helper para formatear Date a HH:mm usando UTC para evitar desfases
const formatTimeUTC = (date: Date | null | undefined) => {
    if (!date) return "00:00";
    const d = new Date(date);
    const h = d.getUTCHours().toString().padStart(2, '0');
    const m = d.getUTCMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
};

// GET /api/horarios
router.get('/', async (_req: Request, res: Response) => {
    try {
        const horarios = await prisma.horario.findMany({
            include: { empleado: true }
        });

        // Formatear horas a HH:mm string para evitar desfases de zona horaria
        const formattedHorarios = horarios.map(h => ({
            ...h,
            hora_inicio: formatTimeUTC(h.hora_inicio),
            hora_fin: formatTimeUTC(h.hora_fin)
        }));

        res.json(formattedHorarios);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener horarios' });
    }
});

// GET /api/horarios/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const id_horario = parseInt(req.params.id as string);
        const horario = await prisma.horario.findUnique({
            where: { id_horario },
            include: { empleado: true }
        });
        if (!horario) return res.status(404).json({ error: 'Horario no encontrado' });

        // Formatear horas a HH:mm string
        const formattedHorario = {
            ...horario,
            hora_inicio: formatTimeUTC(horario.hora_inicio),
            hora_fin: formatTimeUTC(horario.hora_fin)
        };

        res.json(formattedHorario);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el horario' });
    }
});

// POST /api/horarios
router.post('/', async (req: Request, res: Response) => {
    try {
        const { id_empleado, dia_semana, hora_inicio, hora_fin } = req.body;
        if (!id_empleado || !dia_semana || !hora_inicio || !hora_fin) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        // Parsear hora 'HH:MM' a Date object dummy fija en UTC
        const parseHora = (h: string) => {
            const date = new Date("1970-01-01T00:00:00Z");
            const [hours, mins] = h.split(':');
            if (hours) date.setUTCHours(parseInt(hours));
            if (mins) date.setUTCMinutes(parseInt(mins));
            date.setUTCSeconds(0);
            return date;
        };

        const nuevoHorario = await prisma.horario.create({
            data: {
                id_empleado: parseInt(id_empleado as string),
                dia_semana,
                hora_inicio: parseHora(hora_inicio),
                hora_fin: parseHora(hora_fin),
                disponible: req.body.disponible !== undefined ? Boolean(req.body.disponible) : true
            },
            include: { empleado: true }
        });

        // Formatear respuesta
        const response = {
            ...nuevoHorario,
            hora_inicio: formatTimeUTC(nuevoHorario.hora_inicio),
            hora_fin: formatTimeUTC(nuevoHorario.hora_fin)
        };

        res.status(201).json(response);
    } catch (error) {
        console.error('[HORARIOS] ERROR CREATE:', error);
        res.status(500).json({ error: 'Error al crear el horario' });
    }
});

// PUT /api/horarios/:id
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const id_horario = parseInt(req.params.id as string);
        const { id_empleado, dia_semana, hora_inicio, hora_fin } = req.body;

        // Parsear hora 'HH:MM' a Date object dummy fija en UTC
        const parseHora = (h: string) => {
            const date = new Date("1970-01-01T00:00:00Z");
            const [hours, mins] = h.split(':');
            if (hours) date.setUTCHours(parseInt(hours));
            if (mins) date.setUTCMinutes(parseInt(mins));
            date.setUTCSeconds(0);
            return date;
        };

        const updateData: any = {};
        if (id_empleado) updateData.id_empleado = parseInt(id_empleado as string);
        if (dia_semana) updateData.dia_semana = dia_semana;
        if (hora_inicio) updateData.hora_inicio = parseHora(hora_inicio);
        if (hora_fin) updateData.hora_fin = parseHora(hora_fin);
        if (req.body.disponible !== undefined) updateData.disponible = Boolean(req.body.disponible);

        const horario = await prisma.horario.update({
            where: { id_horario },
            data: updateData,
            include: { empleado: true }
        });

        // Formatear respuesta
        const response = {
            ...horario,
            hora_inicio: formatTimeUTC(horario.hora_inicio),
            hora_fin: formatTimeUTC(horario.hora_fin)
        };

        res.json(response);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el horario' });
    }
});

// DELETE /api/horarios/:id
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const id_horario = parseInt(req.params.id as string);
        await prisma.horario.delete({ where: { id_horario } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el horario' });
    }
});

export default router;
