import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.historial_mascotas.count();
        console.log(`TOTAL_REGISTROS_HISTORIAL: ${count}`);

        const latest = await prisma.historial_mascotas.findMany({
            take: 5,
            orderBy: { fecha: 'desc' },
            select: { id_historial: true, fecha: true, motivoConsulta: true }
        });
        console.log('ULTIMOS_REGISTROS:', JSON.stringify(latest, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
