const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const data = {
        nombre: 'Mishell Roldán',
        tipo_documento: 'C.C.',
        cedula: '1025760687',
        correo: 'roldangiraldomishell@gmail.com',
        telefono: '3233755696',
        direccion: 'calle 99',
        cargo: 'Veterinario',
        experiencia: ''
    };

    try {
        const { nombre, tipo_documento, cedula, correo, telefono, direccion, cargo, experiencia } = data;

        const result = await prisma.$transaction(async (tx) => {
            let rol = await tx.roles.findFirst({
                where: { nombre_rol: { contains: cargo || 'Veterinario' } }
            });

            if (!rol) {
                rol = await tx.roles.findFirst({ where: { nombre_rol: 'Veterinario' } });
                if (!rol) {
                    rol = await tx.roles.create({ data: { nombre_rol: 'Veterinario', activo: true } });
                }
            }

            let usuarioVinculado = await tx.usuario.findFirst({
                where: { OR: [{ correo }, { cedula }] }
            });

            if (!usuarioVinculado) {
                const tokenActivacion = Math.random().toString(36).substring(7);
                usuarioVinculado = await tx.usuario.create({
                    data: {
                        nombre_usuario: nombre,
                        correo: correo,
                        cedula: cedula,
                        contrasena: '$2a$10$76YmPvtHqYp.p/f.wzY.Ou6mR.e1kX.H.r1kX.H.r1kX.H.r1kX.H',
                        id_rol: rol.id_rol,
                        activo: true,
                        token_recuperacion: tokenActivacion
                    }
                });
            }

            const empleadoArr = await tx.empleado.create({
                data: {
                    nombre, tipo_documento, cedula, correo,
                    telefono, direccion, cargo,
                    experiencia: experiencia || null
                }
            });

            await tx.usuario.update({
                where: { id_usuario: usuarioVinculado.id_usuario },
                data: { id_empleado: empleadoArr.id_empleado }
            });

            return empleadoArr;
        });

        console.log('EXITO:', result);
    } catch (err) {
        console.error('ERROR MANUAL:', err);
    }
}

run().finally(() => prisma.$disconnect());
