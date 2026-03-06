const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    try {
        const newPassword = 'admin123';
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const email = 'josephballestas10@gmail.com';

        const user = await prisma.usuario.findUnique({
            where: { correo: email }
        });

        if (!user) {
            console.log(`No se encontró el usuario con email: ${email}`);
            return;
        }

        await prisma.usuario.update({
            where: { id_usuario: user.id_usuario },
            data: {
                contrasena: hashedPassword,
                activo: true,
                estado: 'activo'
            }
        });

        console.log(`Contraseña para ${email} restablacida a: ${newPassword}`);
        console.log(`Hash generado: ${hashedPassword}`);

    } catch (error) {
        console.error('Error al resetear contraseña:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
