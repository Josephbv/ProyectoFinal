require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ALL_MODULES = [
    'Dashboard', 'Ventas', 'Clientes', 'Agendamiento',
    'Mascotas', 'Historial Mascotas', 'Horario', 'Servicios',
    'Empleados', 'Roles', 'Usuarios'
];

async function main() {
    console.log('Buscando rol Administrador...');
    const admin = await prisma.roles.findFirst({
        where: { nombre_rol: { contains: 'admin' } }
    });

    if (!admin) {
        console.log('❌ No se encontró el rol Administrador.');
        return;
    }

    console.log(`✅ Encontrado: ID=${admin.id_rol}, Nombre=${admin.nombre_rol}`);

    // Eliminar permisos anteriores
    await prisma.roles_permisos.deleteMany({ where: { id_rol: admin.id_rol } });
    console.log('🗑️  Permisos anteriores eliminados.');

    // Crear o buscar y asignar cada módulo
    for (const modulo of ALL_MODULES) {
        let permiso = await prisma.permisos.findFirst({ where: { descripcion: modulo } });
        if (!permiso) {
            permiso = await prisma.permisos.create({ data: { descripcion: modulo } });
            console.log(`  + Permiso creado: ${modulo}`);
        }
        await prisma.roles_permisos.create({
            data: { id_rol: admin.id_rol, id_permiso: permiso.id_permiso }
        });
    }

    console.log(`\n✅ Administrador ahora tiene ${ALL_MODULES.length} módulos: ${ALL_MODULES.join(', ')}`);
}

main()
    .catch(e => console.error('ERROR:', e))
    .finally(() => prisma.$disconnect());
