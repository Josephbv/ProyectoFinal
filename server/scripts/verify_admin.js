const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const admins = await prisma.usuario.findMany({
            where: {
                rol: {
                    nombre_rol: {
                        contains: 'Admin'
                    }
                }
            },
            select: {
                nombre_usuario: true,
                correo: true,
                estado: true,
                activo: true
            }
        });

        console.log('--- Estado de Administradores ---');
        admins.forEach(a => {
            console.log(`Usuario: ${a.nombre_usuario} | Email: ${a.correo} | Estado: ${a.estado} | Activo: ${a.activo}`);
        });
        console.log('---------------------------------');

    } catch (error) {
        console.error('Error al verificar:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
