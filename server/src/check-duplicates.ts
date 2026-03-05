import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Connecting to database...');
        await prisma.$connect();
        console.log('Connected!');

        const clientes = await prisma.cliente.findMany();
        console.log('Total clients:', clientes.length);
        console.log('Clients data:', JSON.stringify(clientes, null, 2));

        const counts: { [key: string]: number } = {};
        const duplicates: string[] = [];
        clientes.forEach(c => {
            if (c.cedula) {
                counts[c.cedula] = (counts[c.cedula] || 0) + 1;
                if (counts[c.cedula] > 1 && !duplicates.includes(c.cedula)) {
                    duplicates.push(c.cedula);
                }
            }
        });

        if (duplicates.length > 0) {
            console.log('Found duplicate cedulas:', duplicates);
        } else {
            console.log('No duplicate cedulas found.');
        }

    } catch (error) {
        console.error('Error connecting to database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
