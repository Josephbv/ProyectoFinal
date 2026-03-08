const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function check() {
    const users = await prisma.usuario.findMany({
        include: { rol: true }
    });

    const content = JSON.stringify(users.map(u => ({ id: u.id_usuario, nombre: u.nombre_usuario, correo: u.correo, rol: u.rol?.nombre_rol, id_cliente: u.id_cliente, id_empleado: u.id_empleado })), null, 2);
    fs.writeFileSync('users_clean.json', content, 'utf-8');
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
