const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const count = await prisma.historial_mascotas.count();
    console.log('--- DATABASE STATUS ---');
    console.log('Total registros:', count);
    const items = await prisma.historial_mascotas.findMany({
        take: 10,
        orderBy: { id_historial: 'desc' },
        include: {
            mascota: {
                include: {
                    cliente: true
                }
            }
        }
    });
    console.log('Últimos 10 registros:');
    items.forEach(h => {
        console.log(`- ID: ${h.id_historial}, Fecha: ${h.fecha}, Mascota: ${h.mascota?.nombre}, Cliente: ${h.mascota?.cliente?.nombre}`);
    });
}
main().catch(console.error).finally(() => prisma.$disconnect());
