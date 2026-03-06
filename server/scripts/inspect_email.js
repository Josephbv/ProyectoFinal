const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const user = await prisma.usuario.findUnique({
            where: { id_usuario: 32 }
        });

        if (!user) {
            console.log('User not found by ID 32');
            return;
        }

        console.log(`Email raw: "${user.correo}"`);
        console.log(`Email length: ${user.correo.length}`);
        console.log(`Email trimmed length: ${user.correo.trim().length}`);

        // Check for non-printable characters
        const hex = Buffer.from(user.correo, 'utf8').toString('hex');
        console.log(`Email Hex: ${hex}`);

    } catch (error) {
        console.error('Error detail checking:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
