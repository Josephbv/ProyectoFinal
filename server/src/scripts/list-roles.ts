import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
    const roles = await prisma.roles.findMany();
    console.log(`TOTAL ROLES: ${roles.length}`);
    console.log(JSON.stringify(roles, null, 2));
    await prisma.$disconnect();
}
run();
