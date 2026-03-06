require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Buscando rol Asistente para renombrar a Veterinario...');

    // Rename the role in the roles table
    const result = await prisma.roles.updateMany({
        where: {
            nombre_rol: 'Asistente'
        },
        data: {
            nombre_rol: 'Veterinario'
        }
    });

    console.log(`✅ Se actualizaron ${result.count} registros en la tabla de roles.`);

    // Verify if it exists or was already renamed
    const roles = await prisma.roles.findMany({
        where: {
            nombre_rol: 'Veterinario'
        }
    });

    console.log('Roles actuales llamados Veterinario:', roles.map(r => r.nombre_rol));
}

main()
    .catch(e => {
        console.error('ERROR:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
