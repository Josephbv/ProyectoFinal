import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3001/api/roles';

async function testDeletion() {
    console.log('--- TESTING ROLE DELETION ---');
    try {
        // 1. Create a role with a permission
        console.log('Creating a role to delete...');
        const createRes = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre: 'RoleToDelete ' + Date.now(),
                activo: true,
                modulos: ['Dashboard']
            })
        });

        const createData: any = await createRes.json();
        console.log('Created Role ID:', createData.id);

        // 2. Try to delete it
        console.log('Attempting to delete the role...');
        const deleteRes = await fetch(`${API_URL}/${createData.id}`, {
            method: 'DELETE'
        });

        if (deleteRes.ok) {
            console.log('✅ Role deleted successfully');
        } else {
            const errorData = await deleteRes.json();
            console.log('❌ Deletion failed:', errorData);

            // Check if it's because of permissions
            const roleStillExists = await prisma.roles.findUnique({
                where: { id_rol: parseInt(createData.id) },
                include: { roles_permisos: true }
            });
            console.log('Role still in DB?', !!roleStillExists);
            console.log('Permissions count:', roleStillExists?.roles_permisos.length);
        }

        // Cleanup if failed
        if (createData.id) {
            await prisma.roles_permisos.deleteMany({ where: { id_rol: parseInt(createData.id) } }).catch(() => { });
            await prisma.roles.delete({ where: { id_rol: parseInt(createData.id) } }).catch(() => { });
        }

    } catch (error: any) {
        console.error('TEST FAILED:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testDeletion();
