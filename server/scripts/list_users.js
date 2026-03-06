const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.usuario.findMany({
            include: { rol: true }
        });

        console.log('--- All Users ---');
        users.forEach(u => {
            console.log(`ID: ${u.id_usuario} | User: ${u.nombre_usuario} | Email: ${u.correo} | Rol: ${u.rol.nombre_rol} | Active: ${u.activo}`);
        });
        console.log('-----------------');

    } catch (error) {
        console.error('Error listing users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
