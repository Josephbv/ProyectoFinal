require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Buscando usuario josephballestas10@gmail.com...');
        const usuario = await prisma.usuario.findFirst({
            where: { correo: 'josephballestas10@gmail.com' }
        });

        if (usuario) {
            console.log('Usuario encontrado. Actualizando a kaivetmanager@gmail.com...');
            await prisma.usuario.update({
                where: { id_usuario: usuario.id_usuario },
                data: { correo: 'kaivetmanager@gmail.com' }
            });
            console.log('¡Correo actualizado exitosamente!');
        } else {
            console.log('No se encontró el usuario josephballestas10@gmail.com. Creando kaivetmanager@gmail.com...');
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('password123', 10);

            let rol = await prisma.rol.findFirst();
            if (!rol) rol = await prisma.rol.create({ data: { nombre_rol: 'Admin' } });

            await prisma.usuario.create({
                data: {
                    correo: 'kaivetmanager@gmail.com',
                    contrasena: hashedPassword,
                    nombre_usuario: 'KaiVet Manager',
                    id_rol: rol.id_rol
                }
            });
            console.log('¡Nuevo usuario kaivetmanager@gmail.com creado exitosamente!');
        }
    } catch (error) {
        console.error('Error durante el proceso:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
