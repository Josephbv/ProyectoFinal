const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const hists = await prisma.historial_mascotas.findMany();
    console.log('--- ALL HISTORIAL RECORDS ---');
    hists.forEach(h => {
        console.log(`ID: ${h.id_historial}, MascotaID: ${h.id_mascota}, Motivo: ${h.motivoConsulta}`);
    });

    const mascs = await prisma.mascotas.findMany();
    console.log('--- ALL MASCOTA RECORDS ---');
    mascs.forEach(m => {
        console.log(`ID: ${m.id_mascota}, Nombre: ${m.nombre}`);
    });
}
main().catch(console.error).finally(() => prisma.$disconnect());
