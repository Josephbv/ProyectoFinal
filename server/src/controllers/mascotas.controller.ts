import { Request, Response } from 'express';
import prisma from '../config/prisma';

export class MascotasController {
    static async getMascotas(_req: Request, res: Response) {
        try {
            const mascotas = await prisma.mascotas.findMany({
                include: { cliente: true },
            });
            res.json(mascotas);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener mascotas' });
        }
    }

    static async getMascotaById(req: Request, res: Response) {
        try {
            const id_mascota = parseInt(req.params.id as string);
            const mascota = await prisma.mascotas.findUnique({
                where: { id_mascota },
                include: { cliente: true },
            });
            if (!mascota) return res.status(404).json({ error: 'Mascota no encontrada' });
            res.json(mascota);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener la mascota' });
        }
    }

    static async createMascota(req: Request, res: Response) {
        console.log('[MASCOTAS] Petición POST recibida:', req.body);
        try {
            const {
                id_cliente, nombre, especie, raza, edad,
                fecha_nacimiento, peso, vacunas,
                fecha_ultima_vacuna, fecha_desparasitacion,
                foto, observaciones
            } = req.body;

            if (!id_cliente || !nombre) {
                return res.status(400).json({ error: 'ID de cliente y nombre son requeridos' });
            }

            const data: any = {
                nombre,
                especie,
                raza,
                id_cliente: parseInt(id_cliente as string),
                edad: edad ? parseInt(edad as string) : null,
                fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : null,
                peso: peso ? parseFloat(peso as string) : null,
                vacunas: typeof vacunas === 'string' ? vacunas : (Array.isArray(vacunas) ? vacunas.join(', ') : null),
                fecha_ultima_vacuna: fecha_ultima_vacuna ? new Date(fecha_ultima_vacuna) : null,
                fecha_desparasitacion: fecha_desparasitacion ? new Date(fecha_desparasitacion) : null,
                foto,
                observaciones
            };

            const nuevaMascota = await prisma.mascotas.create({
                data,
                include: { cliente: true }
            });
            res.status(201).json(nuevaMascota);
        } catch (error) {
            console.error('[MASCOTAS] ERROR CRÍTICO AL CREAR:', error);
            res.status(500).json({ error: 'Error al crear la mascota' });
        }
    }

    static async updateMascota(req: Request, res: Response) {
        try {
            const id_mascota = parseInt(req.params.id as string);
            const {
                id_cliente, nombre, especie, raza, edad,
                fecha_nacimiento, peso, vacunas,
                fecha_ultima_vacuna, fecha_desparasitacion,
                foto, observaciones
            } = req.body;

            const data: any = {
                nombre,
                especie,
                raza,
                id_cliente: id_cliente ? parseInt(id_cliente as string) : undefined,
                edad: edad !== undefined ? (edad ? parseInt(edad as string) : null) : undefined,
                fecha_nacimiento: fecha_nacimiento !== undefined ? (fecha_nacimiento ? new Date(fecha_nacimiento) : null) : undefined,
                peso: peso !== undefined ? (peso ? parseFloat(peso as string) : null) : undefined,
                vacunas: vacunas !== undefined ? (typeof vacunas === 'string' ? vacunas : (Array.isArray(vacunas) ? vacunas.join(', ') : null)) : undefined,
                fecha_ultima_vacuna: fecha_ultima_vacuna !== undefined ? (fecha_ultima_vacuna ? new Date(fecha_ultima_vacuna) : null) : undefined,
                fecha_desparasitacion: fecha_desparasitacion !== undefined ? (fecha_desparasitacion ? new Date(fecha_desparasitacion) : null) : undefined,
                foto,
                observaciones
            };

            const actualizada = await prisma.mascotas.update({
                where: { id_mascota },
                data,
                include: { cliente: true }
            });
            res.json(actualizada);
        } catch (error) {
            console.error('[MASCOTAS] ERROR AL ACTUALIZAR:', error);
            res.status(500).json({ error: 'Error al actualizar la mascota' });
        }
    }

    static async deleteMascota(req: Request, res: Response) {
        try {
            const id_mascota = parseInt(req.params.id as string);

            await prisma.$transaction([
                prisma.historial_mascotas.deleteMany({ where: { id_mascota } }),
                prisma.mascotas.delete({ where: { id_mascota } })
            ]);

            res.json({ success: true });
        } catch (error: any) {
            console.error('[MASCOTAS] ERROR AL ELIMINAR:', error);
            res.status(500).json({ error: 'Error al eliminar la mascota: ' + error.message });
        }
    }
}
