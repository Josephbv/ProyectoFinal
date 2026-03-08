const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function check() {
    const empleados = await prisma.empleado.findMany();
    fs.writeFileSync('empleados_clean.json', JSON.stringify(empleados, null, 2), 'utf-8');

    const clientes = await prisma.cliente.findMany();
    fs.writeFileSync('clientes_clean.json', JSON.stringify(clientes, null, 2), 'utf-8');
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
