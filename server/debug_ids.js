const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const all = await prisma.historial_mascotas.findMany();
    console.log('--- ALL RECORDS ---');
    console.log('Count:', all.length);
    all.forEach(h => {
        console.log(`ID: ${h.id_historial}, MascotaID: ${h.id_mascota}, Fecha: ${h.fecha}`);
    });

    const mascotasCount = await prisma.mascotas.count();
    console.log('Total Mascotas:', mascotasCount);

    const idsMascotas = (await prisma.mascotas.findMany({ select: { id_mascota: true } })).map(m => m.id_mascota);
    console.log('IDs Mascotas existentes:', idsMascotas);
}
main().catch(console.error).finally(() => prisma.$disconnect());
