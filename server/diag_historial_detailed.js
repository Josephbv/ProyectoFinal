const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const cliente = await prisma.cliente.findFirst({
            include: {
                mascotas: true,
                usuario: true
            }
        });
        console.log('Cliente:', JSON.stringify(cliente, null, 2));

        const allPets = await prisma.mascotas.findMany();
        console.log('Todas las Mascotas:', JSON.stringify(allPets, null, 2));

        const hists = await prisma.historial_mascotas.findMany();
        console.log('Todos los Historiales:', JSON.stringify(hists, null, 2));

        // Check for any records without valid relations? (Shouldn't happen with FKs but still)
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
