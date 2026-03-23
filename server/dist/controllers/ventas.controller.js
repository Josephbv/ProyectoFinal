"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VentasController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class VentasController {
    static async getVentas(_req, res) {
        try {
            const ventas = await prisma_1.default.ventas.findMany({
                include: {
                    cliente: true,
                    venta_servicios: {
                        include: { servicio: true }
                    }
                },
                orderBy: { fecha: 'desc' }
            });
            res.json(ventas);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener ventas' });
        }
    }
    static async getVentaById(req, res) {
        try {
            const id_venta = parseInt(req.params.id);
            const venta = await prisma_1.default.ventas.findUnique({
                where: { id_venta },
                include: {
                    cliente: true,
                    venta_servicios: {
                        include: { servicio: true }
                    }
                }
            });
            if (!venta)
                return res.status(404).json({ error: 'Venta no encontrada' });
            res.json(venta);
        }
        catch (error) {
            res.status(500).json({ error: 'Error al obtener la venta' });
        }
    }
    static async createVenta(req, res) {
        try {
            const { id_cliente, total, servicios } = req.body;
            if (!id_cliente) {
                return res.status(400).json({ error: 'El ID de cliente es obligatorio' });
            }
            const nuevaVenta = await prisma_1.default.ventas.create({
                data: {
                    id_cliente: parseInt(id_cliente),
                    fecha: new Date(),
                    total: parseFloat(total || '0'),
                    estado: 'aprobada',
                    venta_servicios: {
                        create: (servicios || []).map((serv) => ({
                            id_servicio: parseInt(serv.id_servicio),
                            cantidad: serv.cantidad ? parseInt(serv.cantidad) : 1
                        }))
                    }
                },
                include: {
                    cliente: true,
                    venta_servicios: { include: { servicio: true } }
                }
            });
            res.status(201).json(nuevaVenta);
        }
        catch (error) {
            console.error('[VENTAS] ERROR CREATE:', error);
            res.status(500).json({ error: 'Error al crear la venta' });
        }
    }
    static async anularVenta(req, res) {
        try {
            const id_venta = parseInt(req.params.id);
            const venta = await prisma_1.default.ventas.update({
                where: { id_venta },
                data: { estado: 'anulada' }
            });
            res.json({ success: true, message: 'Venta anulada correctamente', venta });
        }
        catch (error) {
            console.error('[VENTAS] ERROR ANULAR:', error);
            res.status(500).json({ error: 'Error al anular la venta' });
        }
    }
    static async deleteAllVentas(_req, res) {
        try {
            await prisma_1.default.$transaction([
                prisma_1.default.venta_servicios.deleteMany({}),
                prisma_1.default.ventas.deleteMany({})
            ]);
            await prisma_1.default.$executeRawUnsafe(`DBCC CHECKIDENT ('ventas', RESEED, 0)`);
            res.json({ success: true, message: 'Todas las ventas han sido eliminadas y el contador reiniciado' });
        }
        catch (error) {
            console.error('[VENTAS] ERROR AL BORRAR TODO:', error);
            res.status(500).json({ error: 'Error al eliminar todas las ventas' });
        }
    }
}
exports.VentasController = VentasController;
