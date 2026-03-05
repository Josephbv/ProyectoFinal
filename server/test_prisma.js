const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- CLIENTE CHECK ---');
        const clientes = await prisma.cliente.findMany();
        console.log('Total clients:', clientes.length);
        clientes.forEach(c => console.log(`ID: ${c.id_cliente}, Nombre: ${c.nombre}, TipoDoc: ${c.tipo_documento}, Cedula: ${c.cedula}`));

        console.log('\n--- MASCOTAS CHECK ---');
        const mascotas = await prisma.mascotas.findMany();
        console.log('Total pets:', mascotas.length);
        mascotas.forEach(m => console.log(`ID: ${m.id_mascota}, Nombre: ${m.nombre}, Edad: ${m.edad}, Peso: ${m.peso}`));

        console.log('\n--- USUARIO CHECK ---');
        const usuarios = await prisma.usuario.findMany();
        console.log('Total users:', usuarios.length);
        usuarios.forEach(u => console.log(`ID: ${u.id_usuario}, User: ${u.nombre_usuario}, ClientID: ${u.id_cliente}, EmpID: ${u.id_empleado}`));

    } catch (error) {
        console.error('Error during the test:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
