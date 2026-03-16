import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();
async function main() {
    const c = await prisma.cliente.findMany();
    const e = await prisma.empleado.findMany();
    const u = await prisma.usuario.findMany({ include: { rol: true } });
    const data = JSON.stringify({ clientes: c, empleados: e, usuarios: u }, null, 2);
    fs.writeFileSync('result3.txt', data);
}
main().finally(() => prisma.$disconnect());
