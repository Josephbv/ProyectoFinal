import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';

const router = Router();

// GET /api/historial - Obtener todo el historial (Orden cronológico inverso)
router.get('/', async (_req: Request, res: Response) => {
    try {
        const historial = await prisma.historial_mascotas.findMany({
            include: { mascota: { include: { cliente: true } } },
            orderBy: { fecha: 'desc' }
        });
        res.json(historial);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener historial' });
    }
});

// GET /api/historial/mascota/:id - Obtener historial por mascota (Línea de tiempo)
router.get('/mascota/:id', async (req: Request, res: Response) => {
    try {
        const id_mascota = parseInt(req.params.id as string);
        const historial = await prisma.historial_mascotas.findMany({
            where: { id_mascota },
            orderBy: { fecha: 'desc' }
        });
        res.json(historial);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener historial de la mascota' });
    }
});

// GET /api/historial/:id - Obtener una entrada de historial por ID
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const id_historial = parseInt(req.params.id as string);
        const entrada = await prisma.historial_mascotas.findUnique({
            where: { id_historial },
            include: { mascota: { include: { cliente: true } } }
        });
        if (!entrada) return res.status(404).json({ error: 'Entrada no encontrada' });
        res.json(entrada);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener entrada de historial' });
    }
});

// POST /api/historial - Agregar entrada al historial
router.post('/', async (req: Request, res: Response) => {
    try {
        const {
            id_mascota, fecha, hora, tipoVisita, veterinario, motivoConsulta,
            sintomas, diagnostico, tratamiento, medicamentos, examenes,
            peso, temperatura, frecuenciaCardiaca, frecuenciaRespiratoria,
            estado, proximaCita, observaciones, costo, vacunasAplicadas, receta
        } = req.body;

        if (!id_mascota) {
            return res.status(400).json({ error: 'ID de mascota es obligatorio' });
        }

        const cleanIdMascota = parseInt(id_mascota);
        if (isNaN(cleanIdMascota)) {
            return res.status(400).json({ error: 'ID de mascota inválido' });
        }

        const data: any = {
            id_mascota: cleanIdMascota,
            fecha: fecha ? new Date(fecha) : new Date(),
            hora: hora || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            tipoVisita: Array.isArray(tipoVisita) ? JSON.stringify(tipoVisita) : (tipoVisita || 'consulta'),
            veterinario: veterinario || 'Sin asignar',
            motivoConsulta: motivoConsulta || '',
            sintomas: Array.isArray(sintomas) ? JSON.stringify(sintomas) : (sintomas || ''),
            diagnostico: diagnostico || '',
            tratamiento: tratamiento || '',
            medicamentos: Array.isArray(medicamentos) ? JSON.stringify(medicamentos) : (medicamentos || ''),
            examenes: Array.isArray(examenes) ? JSON.stringify(examenes) : (examenes || ''),
            peso: (peso && !isNaN(parseFloat(peso))) ? parseFloat(peso) : null,
            temperatura: (temperatura && !isNaN(parseFloat(temperatura))) ? parseFloat(temperatura) : null,
            frecuenciaCardiaca: (frecuenciaCardiaca && !isNaN(parseInt(frecuenciaCardiaca))) ? parseInt(frecuenciaCardiaca) : null,
            frecuenciaRespiratoria: (frecuenciaRespiratoria && !isNaN(parseInt(frecuenciaRespiratoria))) ? parseInt(frecuenciaRespiratoria) : null,
            estado: estado || 'activo',
            proximaCita: proximaCita ? new Date(proximaCita) : null,
            observaciones: observaciones || '',
            costo: (costo && !isNaN(parseFloat(costo))) ? parseFloat(costo) : null,
            vacunasAplicadas: Array.isArray(vacunasAplicadas) ? JSON.stringify(vacunasAplicadas) : (vacunasAplicadas || ''),
            receta: receta || ''
        };

        const nueva = await prisma.historial_mascotas.create({
            data,
            include: { mascota: { include: { cliente: true } } }
        });
        console.log(`[SUCCESS] HISTORIAL CREADO ID: ${nueva.id_historial} PARA MASCOTA: ${id_mascota}`);
        res.status(201).json(nueva);
    } catch (error: any) {
        console.error('[HISTORIAL] POST ERROR:', error);
        res.status(500).json({ error: 'Error al crear entrada en historial', details: error.message });
    }
});

// PUT /api/historial/:id - Actualizar una entrada de historial
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const id_historial = parseInt(req.params.id as string);
        const {
            id_mascota, fecha, hora, tipoVisita, veterinario, motivoConsulta,
            sintomas, diagnostico, tratamiento, medicamentos, examenes,
            peso, temperatura, frecuenciaCardiaca, frecuenciaRespiratoria,
            estado, proximaCita, observaciones, costo, vacunasAplicadas, receta
        } = req.body;

        const cleanIdMascota = id_mascota ? parseInt(id_mascota) : undefined;
        if (cleanIdMascota !== undefined && isNaN(cleanIdMascota)) {
            return res.status(400).json({ error: 'ID de mascota inválido' });
        }

        const data: any = {};
        if (cleanIdMascota !== undefined) data.id_mascota = cleanIdMascota;
        if (fecha !== undefined) data.fecha = fecha ? new Date(fecha) : undefined; // Changed from new Date() to undefined if fecha is falsy
        if (hora !== undefined) data.hora = hora;
        if (tipoVisita !== undefined) data.tipoVisita = Array.isArray(tipoVisita) ? JSON.stringify(tipoVisita) : tipoVisita;
        if (veterinario !== undefined) data.veterinario = veterinario || 'Sin asignar';
        if (motivoConsulta !== undefined) data.motivoConsulta = motivoConsulta || '';
        if (sintomas !== undefined) data.sintomas = Array.isArray(sintomas) ? JSON.stringify(sintomas) : (sintomas || '');
        if (diagnostico !== undefined) data.diagnostico = diagnostico || '';
        if (tratamiento !== undefined) data.tratamiento = tratamiento || '';
        if (medicamentos !== undefined) data.medicamentos = Array.isArray(medicamentos) ? JSON.stringify(medicamentos) : (medicamentos || '');
        if (examenes !== undefined) data.examenes = Array.isArray(examenes) ? JSON.stringify(examenes) : (examenes || '');
        if (peso !== undefined) data.peso = (peso && !isNaN(parseFloat(peso))) ? parseFloat(peso) : null;
        if (temperatura !== undefined) data.temperatura = (temperatura && !isNaN(parseFloat(temperatura))) ? parseFloat(temperatura) : null;
        if (frecuenciaCardiaca !== undefined) data.frecuenciaCardiaca = (frecuenciaCardiaca && !isNaN(parseInt(frecuenciaCardiaca))) ? parseInt(frecuenciaCardiaca) : null;
        if (frecuenciaRespiratoria !== undefined) data.frecuenciaRespiratoria = (frecuenciaRespiratoria && !isNaN(parseInt(frecuenciaRespiratoria))) ? parseInt(frecuenciaRespiratoria) : null;
        if (estado !== undefined) data.estado = estado;
        if (proximaCita !== undefined) data.proximaCita = proximaCita ? new Date(proximaCita) : null;
        if (observaciones !== undefined) data.observaciones = observaciones || '';
        if (costo !== undefined) data.costo = (costo && !isNaN(parseFloat(costo))) ? parseFloat(costo) : null;
        if (vacunasAplicadas !== undefined) data.vacunasAplicadas = Array.isArray(vacunasAplicadas) ? JSON.stringify(vacunasAplicadas) : (vacunasAplicadas || '');
        if (receta !== undefined) data.receta = receta || '';

        const actualizada = await prisma.historial_mascotas.update({
            where: { id_historial },
            data,
            include: { mascota: { include: { cliente: true } } }
        });
        res.json(actualizada);
    } catch (error) {
        console.error('[HISTORIAL] PUT ERROR:', error);
        res.status(500).json({ error: 'Error al actualizar historial' });
    }
});

// DELETE /api/historial/:id - Eliminar una entrada de historial
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const id_historial = parseInt(req.params.id as string);
        console.log(`[ALERT] ELIMINANDO HISTORIAL ID: ${id_historial}`);
        await prisma.historial_mascotas.delete({ where: { id_historial } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar historial' });
    }
});

export default router;
