const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const clientes = await prisma.cliente.count();
        const mascotas = await prisma.mascotas.count();
        const usuarios = await prisma.usuario.count();
        console.log('DATOS_DB:', JSON.stringify({ clientes, mascotas, usuarios }));
    } catch (err) {
        console.error('ERROR_DB:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

check();
