import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanRoles() {
    try {
        console.log('Fetching roles...');
        const allRoles = await prisma.roles.findMany({
            include: { roles_permisos: { include: { permiso: true } } }
        });

        const coreNames = ['Administrador', 'Cliente', 'Veterinario'];

        for (const coreName of coreNames) {
            const matches = allRoles.filter(r => r.nombre_rol.toLowerCase() === coreName.toLowerCase());

            if (matches.length > 1) {
                console.log(`Found duplicates for ${coreName}:`, matches.map(m => m.id_rol));
                // Sort by id_rol asc, keep first, or keep the one with most permissions
                const mainRol = matches.sort((a, b) => b.roles_permisos.length - a.roles_permisos.length)[0]; // keep with most

                const duplicates = matches.filter(r => r.id_rol !== mainRol.id_rol);
                for (const dup of duplicates) {
                    console.log(`Deleting duplicate role: ${dup.nombre_rol} with ID ${dup.id_rol}`);

                    // Reassign users
                    await prisma.usuario.updateMany({
                        where: { id_rol: dup.id_rol },
                        data: { id_rol: mainRol.id_rol }
                    });

                    // Delete permissions
                    await prisma.roles_permisos.deleteMany({
                        where: { id_rol: dup.id_rol }
                    });

                    // Delete role
                    await prisma.roles.delete({
                        where: { id_rol: dup.id_rol }
                    });
                    console.log(`Deleted successfully.`);
                }
            }
        }
    } catch (error) {
        console.error('Error cleaning roles:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanRoles();
