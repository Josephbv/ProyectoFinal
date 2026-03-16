import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const c = await prisma.cliente.findUnique({ where: { id_cliente: 13 } });
    console.log("Cliente:", c);
    if (c && c.correo) {
        const u = await prisma.usuario.findFirst({ where: { correo: c.correo } });
        console.log("Usuario for that correo:", u);
    }
}
main();
