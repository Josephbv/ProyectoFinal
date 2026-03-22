import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';

const router = Router();

// GET /api/ventas - Obtener todas las ventas
router.get('/', async (_req: Request, res: Response) => {
    try {
        const ventas = await prisma.ventas.findMany({
            include: {
                cliente: true,
                venta_servicios: {
                    include: { servicio: true }
                }
            },
            orderBy: { fecha: 'desc' }
        });
        res.json(ventas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener ventas' });
    }
});

// GET /api/ventas/:id - Obtener una venta por ID
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const id_venta = parseInt(req.params.id as string);
        const venta = await prisma.ventas.findUnique({
            where: { id_venta },
            include: {
                cliente: true,
                venta_servicios: {
                    include: { servicio: true }
                }
            }
        });
        if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });
        res.json(venta);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener la venta' });
    }
});

// POST /api/ventas - Crear una nueva venta (Aprobada por defecto)
router.post('/', async (req: Request, res: Response) => {
    try {
        const { id_cliente, total, servicios } = req.body;

        if (!id_cliente) {
            return res.status(400).json({ error: 'El ID de cliente es obligatorio' });
        }

        const nuevaVenta = await prisma.ventas.create({
            data: {
                id_cliente: parseInt(id_cliente as string),
                fecha: new Date(), // Siempre fecha actual según requerimiento
                total: parseFloat(total || '0'),
                estado: 'aprobada',
                venta_servicios: {
                    create: (servicios || []).map((serv: any) => ({
                        id_servicio: parseInt(serv.id_servicio as string),
                        cantidad: serv.cantidad ? parseInt(serv.cantidad as string) : 1
                    }))
                }
            },
            include: {
                cliente: true,
                venta_servicios: { include: { servicio: true } }
            }
        });

        res.status(201).json(nuevaVenta);
    } catch (error) {
        console.error('[VENTAS] ERROR CREATE:', error);
        res.status(500).json({ error: 'Error al crear la venta' });
    }
});

// PATCH /api/ventas/anular/:id - Anular una venta
// Según el requerimiento, las ventas no se borran ni editan, solo se anulan.
router.patch('/anular/:id', async (req: Request, res: Response) => {
    try {
        const id_venta = parseInt(req.params.id as string);

        const venta = await prisma.ventas.update({
            where: { id_venta },
            data: { estado: 'anulada' }
        });

        res.json({ success: true, message: 'Venta anulada correctamente', venta });
    } catch (error) {
        console.error('[VENTAS] ERROR ANULAR:', error);
        res.status(500).json({ error: 'Error al anular la venta' });
    }
});

// Nota: Las rutas PUT y DELETE se deshabilitan por lógica de negocio
// router.put('/:id', ...) -> No permitido
// router.delete('/:id', ...) -> No permitido

export default router;
