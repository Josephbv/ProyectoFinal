const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
    const adminRol = await prisma.roles.findFirst({ where: { nombre_rol: 'Administrador' } });

    const emp = await prisma.empleado.findFirst({ where: { correo: 'roldangiraldomishell@gmail.com' } });
    const cli = await prisma.cliente.findFirst({ where: { correo: 'roldangiraldomishell@gmail.com' } });

    await prisma.usuario.updateMany({
        where: { correo: 'roldangiraldomishell@gmail.com' },
        data: {
            id_empleado: emp ? emp.id_empleado : null,
            id_cliente: cli ? cli.id_cliente : null,
            id_rol: adminRol.id_rol
        }
    });
    console.log("Fixed Mishell data.");
}

fix().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
