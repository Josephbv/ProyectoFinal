import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("--- CLIENTES ---");
    const clientes = await prisma.cliente.findMany({
        where: { nombre: { contains: 'Carlos' } }
    });
    console.log(clientes);

    console.log("\n--- EMPLEADOS ---");
    const empleados = await prisma.empleado.findMany({
        where: { nombre: { contains: 'Carlos' } }
    });
    console.log(empleados);

    console.log("\n--- USUARIOS (Por nombre o correo) ---");
    const usuariosByName = await prisma.usuario.findMany({
        where: {
            OR: [
                { nombre_completo: { contains: 'Carlos' } },
                { correo: { contains: 'carlos' } },
                { id_cliente: { in: clientes.map(c => c.id_cliente) } },
                { id_empleado: { in: empleados.map(e => e.id_empleado) } }
            ]
        },
        include: { rol: true }
    });
    console.log(usuariosByName);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
