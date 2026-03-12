const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const email = 'roldangiraldomishell@gmail.com';
    const cedula = '1025760687';

    const user = await prisma.usuario.findFirst({
        where: { OR: [{ correo: email }, { cedula: cedula }] }
    });

    const emp = await prisma.empleado.findFirst({
        where: { OR: [{ correo: email }, { cedula: cedula }] }
    });

    console.log('Usuario encontrado:', user);
    console.log('Empleado encontrado:', emp);
}

run().finally(() => prisma.$disconnect());
