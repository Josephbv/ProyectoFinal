const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const emailToSearch = 'josephballestas10@gmail.com';
        const user = await prisma.usuario.findFirst({
            where: {
                OR: [
                    { correo: emailToSearch },
                    { nombre_usuario: { contains: 'joseph' } }
                ]
            },
            include: { rol: true }
        });

        if (!user) {
            console.log('No user found with email or name similar to joseph');
            return;
        }

        console.log('--- User Details ---');
        console.log(`ID: ${user.id_usuario}`);
        console.log(`Username: ${user.nombre_usuario}`);
        console.log(`Email: ${user.correo}`);
        console.log(`Role: ${user.rol.nombre_rol}`);
        console.log(`Active: ${user.activo}`);
        console.log(`Status: ${user.estado}`);
        console.log(`Password Hash starts with: ${user.contrasena.substring(0, 10)}...`);
        console.log('--------------------');

    } catch (error) {
        console.error('Error detail checking:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
