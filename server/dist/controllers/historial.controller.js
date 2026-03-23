"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistorialController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class HistorialController {
    static async getHistorial(_req, res) {
        try {
            const historial = await prisma_1.default.historial_mascotas.findMany({
                include: { mascota: { include: { cliente: true } } },
                orderBy: { fecha: 'desc' }
            });
            res.json(historial);
        }
        catch (error) {
            res.status(500).json({ error: 'Error al obtener historial' });
        }
    }
    static async getHistorialByMascota(req, res) {
        try {
            const id_mascota = parseInt(req.params.id);
            const historial = await prisma_1.default.historial_mascotas.findMany({
                where: { id_mascota },
                orderBy: { fecha: 'desc' }
            });
            res.json(historial);
        }
        catch (error) {
            res.status(500).json({ error: 'Error al obtener historial de la mascota' });
        }
    }
    static async getHistorialById(req, res) {
        try {
            const id_historial = parseInt(req.params.id);
            const entrada = await prisma_1.default.historial_mascotas.findUnique({
                where: { id_historial },
                include: { mascota: { include: { cliente: true } } }
            });
            if (!entrada)
                return res.status(404).json({ error: 'Entrada no encontrada' });
            res.json(entrada);
        }
        catch (error) {
            res.status(500).json({ error: 'Error al obtener entrada de historial' });
        }
    }
    static async createHistorial(req, res) {
        try {
            const { id_mascota, fecha, hora, tipoVisita, veterinario, motivoConsulta, sintomas, diagnostico, tratamiento, medicamentos, examenes, peso, temperatura, frecuenciaCardiaca, frecuenciaRespiratoria, estado, proximaCita, observaciones, costo, vacunasAplicadas, receta } = req.body;
            if (!id_mascota) {
                return res.status(400).json({ error: 'ID de mascota es obligatorio' });
            }
            const cleanIdMascota = parseInt(id_mascota);
            if (isNaN(cleanIdMascota)) {
                return res.status(400).json({ error: 'ID de mascota inválido' });
            }
            const data = {
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
            const nueva = await prisma_1.default.historial_mascotas.create({
                data,
                include: { mascota: { include: { cliente: true } } }
            });
            res.status(201).json(nueva);
        }
        catch (error) {
            console.error('[HISTORIAL] POST ERROR:', error);
            res.status(500).json({ error: 'Error al crear entrada en historial', details: error.message });
        }
    }
    static async updateHistorial(req, res) {
        try {
            const id_historial = parseInt(req.params.id);
            const { id_mascota, fecha, hora, tipoVisita, veterinario, motivoConsulta, sintomas, diagnostico, tratamiento, medicamentos, examenes, peso, temperatura, frecuenciaCardiaca, frecuenciaRespiratoria, estado, proximaCita, observaciones, costo, vacunasAplicadas, receta } = req.body;
            const cleanIdMascota = id_mascota ? parseInt(id_mascota) : undefined;
            if (cleanIdMascota !== undefined && isNaN(cleanIdMascota)) {
                return res.status(400).json({ error: 'ID de mascota inválido' });
            }
            const data = {};
            if (cleanIdMascota !== undefined)
                data.id_mascota = cleanIdMascota;
            if (fecha !== undefined)
                data.fecha = fecha ? new Date(fecha) : undefined;
            if (hora !== undefined)
                data.hora = hora;
            if (tipoVisita !== undefined)
                data.tipoVisita = Array.isArray(tipoVisita) ? JSON.stringify(tipoVisita) : tipoVisita;
            if (veterinario !== undefined)
                data.veterinario = veterinario || 'Sin asignar';
            if (motivoConsulta !== undefined)
                data.motivoConsulta = motivoConsulta || '';
            if (sintomas !== undefined)
                data.sintomas = Array.isArray(sintomas) ? JSON.stringify(sintomas) : (sintomas || '');
            if (diagnostico !== undefined)
                data.diagnostico = diagnostico || '';
            if (tratamiento !== undefined)
                data.tratamiento = tratamiento || '';
            if (medicamentos !== undefined)
                data.medicamentos = Array.isArray(medicamentos) ? JSON.stringify(medicamentos) : (medicamentos || '');
            if (examenes !== undefined)
                data.examenes = Array.isArray(examenes) ? JSON.stringify(examenes) : (examenes || '');
            if (peso !== undefined)
                data.peso = (peso && !isNaN(parseFloat(peso))) ? parseFloat(peso) : null;
            if (temperatura !== undefined)
                data.temperatura = (temperatura && !isNaN(parseFloat(temperatura))) ? parseFloat(temperatura) : null;
            if (frecuenciaCardiaca !== undefined)
                data.frecuenciaCardiaca = (frecuenciaCardiaca && !isNaN(parseInt(frecuenciaCardiaca))) ? parseInt(frecuenciaCardiaca) : null;
            if (frecuenciaRespiratoria !== undefined)
                data.frecuenciaRespiratoria = (frecuenciaRespiratoria && !isNaN(parseInt(frecuenciaRespiratoria))) ? parseInt(frecuenciaRespiratoria) : null;
            if (estado !== undefined)
                data.estado = estado;
            if (proximaCita !== undefined)
                data.proximaCita = proximaCita ? new Date(proximaCita) : null;
            if (observaciones !== undefined)
                data.observaciones = observaciones || '';
            if (costo !== undefined)
                data.costo = (costo && !isNaN(parseFloat(costo))) ? parseFloat(costo) : null;
            if (vacunasAplicadas !== undefined)
                data.vacunasAplicadas = Array.isArray(vacunasAplicadas) ? JSON.stringify(vacunasAplicadas) : (vacunasAplicadas || '');
            if (receta !== undefined)
                data.receta = receta || '';
            const actualizada = await prisma_1.default.historial_mascotas.update({
                where: { id_historial },
                data,
                include: { mascota: { include: { cliente: true } } }
            });
            res.json(actualizada);
        }
        catch (error) {
            console.error('[HISTORIAL] PUT ERROR:', error);
            res.status(500).json({ error: 'Error al actualizar historial' });
        }
    }
    static async deleteHistorial(req, res) {
        try {
            const id_historial = parseInt(req.params.id);
            await prisma_1.default.historial_mascotas.delete({ where: { id_historial } });
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json({ error: 'Error al eliminar historial' });
        }
    }
}
exports.HistorialController = HistorialController;
