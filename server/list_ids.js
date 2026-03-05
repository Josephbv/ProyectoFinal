const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const clients = await prisma.cliente.findMany({ select: { id_cliente: true, nombre: true } });
        console.log('Clientes:', JSON.stringify(clients, null, 2));

        const pets = await prisma.mascotas.findMany({ select: { id_mascota: true, nombre: true } });
        console.log('Mascotas:', JSON.stringify(pets, null, 2));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
