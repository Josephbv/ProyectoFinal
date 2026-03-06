const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        // 1. Encontrar el rol de Administrador
        const rolAdmin = await prisma.roles.findFirst({
            where: {
                nombre_rol: {
                    contains: 'Admin'
                }
            }
        });

        if (!rolAdmin) {
            console.log('No se encontró un rol que contenga "Admin"');
            return;
        }

        console.log(`Rol encontrado: ${rolAdmin.nombre_rol} (ID: ${rolAdmin.id_rol})`);

        // 2. Buscar usuarios con ese rol que estén bloqueados o inactivos
        const usuariosAdmin = await prisma.usuario.findMany({
            where: {
                id_rol: rolAdmin.id_rol
            }
        });

        if (usuariosAdmin.length === 0) {
            console.log('No se encontraron usuarios con el rol de Administrador');
            return;
        }

        for (const u of usuariosAdmin) {
            console.log(`Actualizando usuario: ${u.nombre_usuario} (Email: ${u.correo}, Estado actual: ${u.estado}, Activo: ${u.activo})`);

            await prisma.usuario.update({
                where: { id_usuario: u.id_usuario },
                data: {
                    activo: true,
                    estado: 'activo'
                }
            });

            console.log(`Usuario ${u.nombre_usuario} activado correctamente.`);
        }

    } catch (error) {
        console.error('Error al reactivar el admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
