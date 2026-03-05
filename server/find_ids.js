const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const m = await prisma.mascotas.findFirst({
        include: { cliente: true }
    });
    console.log('--- FOUND OWNER/PET ---');
    console.log('Mascota ID:', m?.id_mascota);
    console.log('Mascota Nombre:', m?.nombre);
    console.log('Cliente ID:', m?.id_cliente);
    console.log('Cliente Nombre:', m?.cliente?.nombre);
}
main().catch(console.error).finally(() => prisma.$disconnect());
