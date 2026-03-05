import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Intentando crear usuario inicial...');

        let rol = await prisma.roles.findFirst({ where: { nombre_rol: 'Admin' } });
        if (!rol) {
            rol = await prisma.roles.create({ data: { nombre_rol: 'Admin' } });
            console.log('Rol Admin creado.');
        }

        const pass = await bcrypt.hash('123456789', 10);
        const user = await prisma.usuario.create({
            data: {
                correo: 'josephballestas10@gmail.com',
                contrasena: pass,
                nombre_usuario: 'Joseph Ballestas',
                id_rol: rol.id_rol
            }
        });

        console.log('Usuario creado con éxito:', user.correo);
    } catch (error) {
        console.error('ERROR AL CREAR USUARIO:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
