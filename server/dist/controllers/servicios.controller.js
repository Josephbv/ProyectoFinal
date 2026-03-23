"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiciosController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class ServiciosController {
    static async getServicios(_req, res) {
        try {
            const servicios = await prisma_1.default.servicios.findMany();
            res.json(servicios);
        }
        catch (error) {
            res.status(500).json({ error: 'Error al obtener servicios' });
        }
    }
    static async getServicioById(req, res) {
        try {
            const id_servicio = parseInt(req.params.id);
            const servicio = await prisma_1.default.servicios.findUnique({
                where: { id_servicio }
            });
            if (!servicio)
                return res.status(404).json({ error: 'Servicio no encontrado' });
            res.json(servicio);
        }
        catch (error) {
            res.status(500).json({ error: 'Error al obtener el servicio' });
        }
    }
    static async createServicio(req, res) {
        try {
            const { nombre_servicio, precio, descripcion, estado } = req.body;
            if (!nombre_servicio)
                return res.status(400).json({ error: 'El nombre del servicio es obligatorio' });
            const nuevoServicio = await prisma_1.default.servicios.create({
                data: {
                    nombre_servicio,
                    precio: precio ? parseFloat(precio) : undefined,
                    descripcion,
                    estado: estado || 'activo'
                }
            });
            res.status(201).json(nuevoServicio);
        }
        catch (error) {
            res.status(500).json({ error: 'Error al crear el servicio' });
        }
    }
    static async updateServicio(req, res) {
        try {
            const id_servicio = parseInt(req.params.id);
            const { nombre_servicio, precio, descripcion, estado } = req.body;
            const actualizado = await prisma_1.default.servicios.update({
                where: { id_servicio },
                data: {
                    nombre_servicio,
                    precio: precio ? parseFloat(precio) : undefined,
                    descripcion,
                    estado
                }
            });
            res.json(actualizado);
        }
        catch (error) {
            res.status(500).json({ error: 'Error al actualizar the service' });
        }
    }
    static async deleteServicio(req, res) {
        try {
            const id_servicio = parseInt(req.params.id);
            const ventasCount = await prisma_1.default.venta_servicios.count({
                where: { id_servicio }
            });
            if (ventasCount > 0) {
                return res.status(400).json({
                    error: `No se puede eliminar el servicio porque ya tiene una venta registrada. Inactívalo para que no aparezca más.`
                });
            }
            await prisma_1.default.$transaction([
                prisma_1.default.agendamiento_servicios.deleteMany({ where: { id_servicio } }),
                prisma_1.default.servicios.delete({ where: { id_servicio } })
            ]);
            res.status(204).send();
        }
        catch (error) {
            console.error('[SERVICIOS] Error delete (Conditional):', error);
            res.status(500).json({ error: 'Error al intentar eliminar el servicio' });
        }
    }
}
exports.ServiciosController = ServiciosController;
