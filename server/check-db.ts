import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- DIAGNÓSTICO DE BASE DE DATOS ---');
    try {
        const clientesCount = await prisma.cliente.count();
        console.log(`Total Clientes: ${clientesCount}`);

        const mascotasCount = await prisma.mascotas.count();
        console.log(`Total Mascotas: ${mascotasCount}`);

        const usuariosCount = await prisma.usuario.count();
        console.log(`Total Usuarios: ${usuariosCount}`);

        const rolesCount = await prisma.roles.count();
        console.log(`Total Roles: ${rolesCount}`);

        if (usuariosCount > 0) {
            const users = await prisma.usuario.findMany({ include: { rol: true } });
            console.log('Usuarios en BD:', JSON.stringify(users, null, 2));
        } else {
            console.log('ADVERTENCIA: No hay usuarios registrados.');
        }

    } catch (error) {
        console.error('ERROR EN DIAGNÓSTICO:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
