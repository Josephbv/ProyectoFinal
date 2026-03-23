import { Request, Response } from 'express';
import prisma from '../config/prisma';

export class ServiciosController {
    static async getServicios(_req: Request, res: Response) {
        try {
            const servicios = await prisma.servicios.findMany();
            res.json(servicios);
        } catch (error) {
            res.status(500).json({ error: 'Error al obtener servicios' });
        }
    }

    static async getServicioById(req: Request, res: Response) {
        try {
            const id_servicio = parseInt(req.params.id as string);
            const servicio = await prisma.servicios.findUnique({
                where: { id_servicio }
            });
            if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado' });
            res.json(servicio);
        } catch (error) {
            res.status(500).json({ error: 'Error al obtener el servicio' });
        }
    }

    static async createServicio(req: Request, res: Response) {
        try {
            const { nombre_servicio, precio, descripcion, estado } = req.body;
            if (!nombre_servicio) return res.status(400).json({ error: 'El nombre del servicio es obligatorio' });

            const nuevoServicio = await prisma.servicios.create({
                data: {
                    nombre_servicio,
                    precio: precio ? parseFloat(precio) : undefined,
                    descripcion,
                    estado: estado || 'activo'
                }
            });
            res.status(201).json(nuevoServicio);
        } catch (error) {
            res.status(500).json({ error: 'Error al crear el servicio' });
        }
    }

    static async updateServicio(req: Request, res: Response) {
        try {
            const id_servicio = parseInt(req.params.id as string);
            const { nombre_servicio, precio, descripcion, estado } = req.body;

            const actualizado = await prisma.servicios.update({
                where: { id_servicio },
                data: {
                    nombre_servicio,
                    precio: precio ? parseFloat(precio) : undefined,
                    descripcion,
                    estado
                }
            });
            res.json(actualizado);
        } catch (error) {
            res.status(500).json({ error: 'Error al actualizar the service' });
        }
    }

    static async deleteServicio(req: Request, res: Response) {
        try {
            const id_servicio = parseInt(req.params.id as string);

            const ventasCount = await prisma.venta_servicios.count({
                where: { id_servicio }
            });

            if (ventasCount > 0) {
                return res.status(400).json({
                    error: `No se puede eliminar el servicio porque ya tiene una venta registrada. Inactívalo para que no aparezca más.`
                });
            }

            await prisma.$transaction([
                prisma.agendamiento_servicios.deleteMany({ where: { id_servicio } }),
                prisma.servicios.delete({ where: { id_servicio } })
            ]);

            res.status(204).send();
        } catch (error) {
            console.error('[SERVICIOS] Error delete (Conditional):', error);
            res.status(500).json({ error: 'Error al intentar eliminar el servicio' });
        }
    }
}
