import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testRoles() {
    try {
        console.log('Fetching roles...');
        const coreNombre = 'Administrador';
        // Test problematic query
        const exists = await prisma.roles.findFirst({
            where: { nombre_rol: { equals: coreNombre, mode: 'insensitive' } as any }
        });
        console.log('Exists:', exists);

        const allRoles = await prisma.roles.findMany({
            include: { roles_permisos: { include: { permiso: true } } }
        });
        console.log('Total roles in DB:', allRoles.length);
        allRoles.forEach(r => {
            console.log(`- ${r.nombre_rol} (ID: ${r.id_rol}, Perms: ${r.roles_permisos.length})`);
        });
    } catch (error) {
        console.error('Error testing roles:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testRoles();
