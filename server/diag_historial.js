const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Full Database Diagnostic ---');
    try {
        const clientesCount = await prisma.cliente.count();
        const mascotasCount = await prisma.mascotas.count();
        const historialesCount = await prisma.historial_mascotas.count();

        console.log(`Clientes: ${clientesCount}`);
        console.log(`Mascotas: ${mascotasCount}`);
        console.log(`Historiales: ${historialesCount}`);

        if (historialesCount > 0) {
            const sample = await prisma.historial_mascotas.findFirst({
                include: { mascota: { include: { cliente: true } } }
            });
            console.log('Sample History Entry:', JSON.stringify(sample, null, 2));
        }

        // Check if there are any recent creations
        const recentHistories = await prisma.historial_mascotas.findMany({
            take: 5,
            orderBy: { id_historial: 'desc' },
            include: { mascota: true }
        });
        console.log('Recent Histories IDs:', recentHistories.map(h => h.id_historial));

    } catch (error) {
        console.error('Error during diagnostic:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
