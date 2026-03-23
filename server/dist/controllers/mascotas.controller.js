"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MascotasController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class MascotasController {
    static async getMascotas(_req, res) {
        try {
            const mascotas = await prisma_1.default.mascotas.findMany({
                include: { cliente: true },
            });
            res.json(mascotas);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener mascotas' });
        }
    }
    static async getMascotaById(req, res) {
        try {
            const id_mascota = parseInt(req.params.id);
            const mascota = await prisma_1.default.mascotas.findUnique({
                where: { id_mascota },
                include: { cliente: true },
            });
            if (!mascota)
                return res.status(404).json({ error: 'Mascota no encontrada' });
            res.json(mascota);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener la mascota' });
        }
    }
    static async createMascota(req, res) {
        console.log('[MASCOTAS] Petición POST recibida:', req.body);
        try {
            const { id_cliente, nombre, especie, raza, edad, fecha_nacimiento, peso, vacunas, fecha_ultima_vacuna, fecha_desparasitacion, foto, observaciones } = req.body;
            if (!id_cliente || !nombre) {
                return res.status(400).json({ error: 'ID de cliente y nombre son requeridos' });
            }
            const data = {
                nombre,
                especie,
                raza,
                id_cliente: parseInt(id_cliente),
                edad: edad ? parseInt(edad) : null,
                fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : null,
                peso: peso ? parseFloat(peso) : null,
                vacunas: typeof vacunas === 'string' ? vacunas : (Array.isArray(vacunas) ? vacunas.join(', ') : null),
                fecha_ultima_vacuna: fecha_ultima_vacuna ? new Date(fecha_ultima_vacuna) : null,
                fecha_desparasitacion: fecha_desparasitacion ? new Date(fecha_desparasitacion) : null,
                foto,
                observaciones
            };
            const nuevaMascota = await prisma_1.default.mascotas.create({
                data,
                include: { cliente: true }
            });
            res.status(201).json(nuevaMascota);
        }
        catch (error) {
            console.error('[MASCOTAS] ERROR CRÍTICO AL CREAR:', error);
            res.status(500).json({ error: 'Error al crear la mascota' });
        }
    }
    static async updateMascota(req, res) {
        try {
            const id_mascota = parseInt(req.params.id);
            const { id_cliente, nombre, especie, raza, edad, fecha_nacimiento, peso, vacunas, fecha_ultima_vacuna, fecha_desparasitacion, foto, observaciones } = req.body;
            const data = {
                nombre,
                especie,
                raza,
                id_cliente: id_cliente ? parseInt(id_cliente) : undefined,
                edad: edad !== undefined ? (edad ? parseInt(edad) : null) : undefined,
                fecha_nacimiento: fecha_nacimiento !== undefined ? (fecha_nacimiento ? new Date(fecha_nacimiento) : null) : undefined,
                peso: peso !== undefined ? (peso ? parseFloat(peso) : null) : undefined,
                vacunas: vacunas !== undefined ? (typeof vacunas === 'string' ? vacunas : (Array.isArray(vacunas) ? vacunas.join(', ') : null)) : undefined,
                fecha_ultima_vacuna: fecha_ultima_vacuna !== undefined ? (fecha_ultima_vacuna ? new Date(fecha_ultima_vacuna) : null) : undefined,
                fecha_desparasitacion: fecha_desparasitacion !== undefined ? (fecha_desparasitacion ? new Date(fecha_desparasitacion) : null) : undefined,
                foto,
                observaciones
            };
            const actualizada = await prisma_1.default.mascotas.update({
                where: { id_mascota },
                data,
                include: { cliente: true }
            });
            res.json(actualizada);
        }
        catch (error) {
            console.error('[MASCOTAS] ERROR AL ACTUALIZAR:', error);
            res.status(500).json({ error: 'Error al actualizar la mascota' });
        }
    }
    static async deleteMascota(req, res) {
        try {
            const id_mascota = parseInt(req.params.id);
            await prisma_1.default.$transaction([
                prisma_1.default.historial_mascotas.deleteMany({ where: { id_mascota } }),
                prisma_1.default.mascotas.delete({ where: { id_mascota } })
            ]);
            res.json({ success: true });
        }
        catch (error) {
            console.error('[MASCOTAS] ERROR AL ELIMINAR:', error);
            res.status(500).json({ error: 'Error al eliminar la mascota: ' + error.message });
        }
    }
}
exports.MascotasController = MascotasController;
