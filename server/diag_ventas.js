const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const ventas = await prisma.ventas.findMany({
        include: {
            venta_servicios: true
        }
    });
    console.log('VENTAS_DATA:');
    console.log(JSON.stringify(ventas, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
