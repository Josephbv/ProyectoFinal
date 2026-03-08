const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const users = await prisma.usuario.findMany({
        include: { rol: true }
    });
    console.log("USERS:", users.map(u => ({ id: u.id_usuario, nombre: u.nombre_usuario, correo: u.correo, rol: u.rol?.nombre_rol, id_cliente: u.id_cliente, id_empleado: u.id_empleado })));

    const empleados = await prisma.empleado.findMany();
    console.log("EMPLEADOS:", empleados.map(e => ({ id: e.id_empleado, nombre: e.nombre, correo: e.correo })));

    const clientes = await prisma.cliente.findMany();
    console.log("CLIENTES:", clientes.map(c => ({ id: c.id_cliente, nombre: c.nombre, correo: c.correo })));
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
