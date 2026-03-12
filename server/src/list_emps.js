const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const emps = await prisma.empleado.findMany({ select: { id_empleado: true, nombre: true } });
    console.log('Empleados actuales:', emps);
}

run().finally(() => prisma.$disconnect());
