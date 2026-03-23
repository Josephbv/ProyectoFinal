"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function run() {
    const roles = await prisma.roles.findMany();
    console.log(`TOTAL ROLES: ${roles.length}`);
    console.log(JSON.stringify(roles, null, 2));
    await prisma.$disconnect();
}
run();
