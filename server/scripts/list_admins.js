const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.usuario.findMany({
            where: {
                OR: [
                    { rol: { nombre_rol: { contains: 'Admin' } } },
                    { nombre_usuario: { contains: 'Joseph' } }
                ]
            },
            include: { rol: true }
        });

        console.log('--- Admin Potential Users ---');
        users.forEach(u => {
            console.log(`ID: ${u.id_usuario} | User: ${u.nombre_usuario} | Email: ${u.correo} | Rol: ${u.rol.nombre_rol} | Active: ${u.activo} | Status: ${u.estado}`);
        });
        console.log('-----------------------------');

    } catch (error) {
        console.error('Error listing admins:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
