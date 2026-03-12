const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const rs = await prisma.roles.findMany();
    console.log('Roles en DB:', rs);
}

run().finally(() => prisma.$disconnect());
