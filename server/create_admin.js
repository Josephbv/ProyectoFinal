const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createAdmin() {
    const email = 'josephballestas10@gmail.com';
    const rawPassword = '123456789';
    const nombre = 'Joseph Ballestas';

    try {
        // 1. Buscar o crear el rol Admin
        let rolAdmin = await prisma.roles.findFirst({
            where: { nombre_rol: { contains: 'admin' } }
        });

        if (!rolAdmin) {
            rolAdmin = await prisma.roles.create({
                data: { nombre_rol: 'Admin', activo: true }
            });
            console.log('Rol Admin creado.');
        }

        // 2. Hash de contraseña
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        // 3. Crear o actualizar el usuario
        const user = await prisma.usuario.upsert({
            where: { correo: email },
            update: {
                contrasena: hashedPassword,
                id_rol: rolAdmin.id_rol,
                activo: true,
                nombre_usuario: nombre
            },
            create: {
                correo: email,
                contrasena: hashedPassword,
                nombre_usuario: nombre,
                id_rol: rolAdmin.id_rol,
                activo: true
            }
        });

        console.log('USUARIO_ADMIN_LISTO:', user.correo);
    } catch (err) {
        console.error('ERROR_CREANDO_ADMIN:', err);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
