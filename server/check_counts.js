const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const c = await prisma.cliente.count();
    const m = await prisma.mascotas.count();
    const h = await prisma.historial_mascotas.count();
    console.log('--- DATABASE COUNTS ---');
    console.log('Clientes:', c);
    console.log('Mascotas:', m);
    console.log('Historiales:', h);

    if (h > 0) {
        const lastHist = await prisma.historial_mascotas.findMany({
            take: 5,
            orderBy: { id_historial: 'desc' },
            include: {
                mascota: {
                    include: {
                        cliente: true
                    }
                }
            }
        });
        console.log('--- LAST HISTORIALS ---');
        lastHist.forEach(item => {
            console.log(`ID: ${item.id_historial}, Mascota: ${item.mascota?.nombre}, Cliente: ${item.mascota?.cliente?.nombre}, Fecha: ${item.fecha}`);
        });
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
