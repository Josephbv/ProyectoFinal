import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const ids = [2, 3];
    for (const id of ids) {
        const emp = await prisma.empleado.findUnique({
            where: { id_empleado: id },
            include: {
                usuarios: true,
                agendaciones: true,
                horarios: true
            }
        });

        if (emp) {
            console.log(`\n--- Empleado ID: ${id} (${emp.nombre}) ---`);
            console.log(`Usuarios: ${emp.usuarios.length}`);
            console.log(`Agendaciones: ${emp.agendaciones.length}`);
            console.log(`Horarios: ${emp.horarios.length}`);
        } else {
            console.log(`Empleado ID ${id} no encontrado.`);
        }
    }
}

check().catch(e => console.error(e)).finally(() => prisma.$disconnect());
