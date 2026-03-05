const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    console.log('--- CONSOLIDATED DB STATE ---');

    const clientes = await prisma.cliente.findMany();
    console.log('\nCLIENTES:', clientes.length);
    clientes.forEach(c => console.log(`  [C-${c.id_cliente}] ${c.nombre} (${c.cedula})`));

    const mascotas = await prisma.mascotas.findMany();
    console.log('\nMASCOTAS:', mascotas.length);
    mascotas.forEach(m => console.log(`  [M-${m.id_mascota}] ${m.nombre} (Dueño: ${m.id_cliente})`));

    const hists = await prisma.historial_mascotas.findMany({
        include: { mascota: true }
    });
    console.log('\nHISTORIALES:', hists.length);
    hists.forEach(h => console.log(`  [H-${h.id_historial}] Mascota: ${h.mascota?.nombre} (${h.id_mascota}), Motivo: ${h.motivoConsulta}, Vet: ${h.veterinario}`));
}
main().catch(console.error).finally(() => prisma.$disconnect());
