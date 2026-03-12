const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    await prisma.empleado.deleteMany({ where: { cedula: '1025760687' } });
    await prisma.usuario.deleteMany({ where: { cedula: '1025760687' } });
    console.log('Mishell borrada para re-probar');
}

run().finally(() => prisma.$disconnect());
