const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const id_empleado = 2; // Carlos
    try {
        const emp = await prisma.empleado.findUnique({
            where: { id_empleado },
            include: {
                usuarios: true,
                agendaciones: { select: { id_agendamiento: true } }
            }
        });

        if (!emp) {
            console.log('Empleado no encontrado');
            return;
        }

        await prisma.$transaction(async (tx) => {
            const idsAgendamientos = emp.agendaciones.map(a => a.id_agendamiento);
            if (idsAgendamientos.length > 0) {
                await tx.agendamiento_servicios.deleteMany({
                    where: { id_agendamiento: { in: idsAgendamientos } }
                });
            }
            await tx.agendamiento.deleteMany({ where: { id_empleado } });
            await tx.horario.deleteMany({ where: { id_empleado } });

            if (emp.usuarios && emp.usuarios.length > 0) {
                for (const u of emp.usuarios) {
                    const userFull = await tx.usuario.findUnique({
                        where: { id_usuario: u.id_usuario },
                        include: { rol: true }
                    });
                    if (userFull?.rol?.nombre_rol === 'Administrador' || userFull?.rol?.nombre_rol === 'Administrador Maestro') {
                        await tx.usuario.update({
                            where: { id_usuario: u.id_usuario },
                            data: { id_empleado: null }
                        });
                    } else {
                        await tx.usuario.delete({ where: { id_usuario: u.id_usuario } });
                    }
                }
            }

            await tx.empleado.delete({ where: { id_empleado } });
        });
        console.log('ELIMINACIÓN EXITOSA');
    } catch (err) {
        console.error('ERROR AL ELIMINAR:', err);
    }
}

run().finally(() => prisma.$disconnect());
