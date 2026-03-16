import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
p.horario.findFirst().then(h => console.log('first horario:', h)).finally(() => p.$disconnect());
