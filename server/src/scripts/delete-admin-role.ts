import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
    try {
        console.log('--- BUSCANDO ROL ADMIN (0 MÓDULOS) ---');

        // 1. Encontrar el rol maestro para reasignar usuarios
        const maestro = await prisma.roles.findFirst({
            where: { nombre_rol: 'Administrador' }
        });

        if (!maestro) {
            console.error('Error: No se encontró el rol "Administrador" (Maestro).');
            return;
        }

        // 2. Encontrar el rol inútil "Admin"
        const rolInutil = await prisma.roles.findFirst({
            where: { nombre_rol: 'Admin' }
        });

        if (!rolInutil) {
            console.log('El rol "Admin" ya no existe o no se encontró.');
            return;
        }

        console.log(`Eliminando rol: ${rolInutil.nombre_rol} (ID: ${rolInutil.id_rol})`);

        // 3. Reasignar usuarios de Admin a Administrador
        const usuariosCambiados = await prisma.usuario.updateMany({
            where: { id_rol: rolInutil.id_rol },
            data: { id_rol: maestro.id_rol }
        });
        console.log(`Se reasignaron ${usuariosCambiados.count} usuarios al rol Administrador.`);

        // 4. Eliminar permisos asociados
        await prisma.roles_permisos.deleteMany({
            where: { id_rol: rolInutil.id_rol }
        });

        // 5. Eliminar el rol
        await prisma.roles.delete({
            where: { id_rol: rolInutil.id_rol }
        });

        console.log('¡Rol Admin eliminado exitosamente!');

    } catch (error) {
        console.error('Error en el script:', error);
    } finally {
        await prisma.$disconnect();
    }
}

run();
