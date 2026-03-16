import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const users = await prisma.usuario.findMany({ include: { rol: true } });
    console.log(JSON.stringify(users.map(u => ({ id: u.id_usuario, nom: u.nombre_completo, co: u.correo, rn: u.rol?.nombre_rol })), null, 2));
}
main();
