const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    console.log('--- TEST INSERTION ---');
    const testHist = await prisma.historial_mascotas.create({
        data: {
            id_mascota: 1,
            fecha: new Date(),
            hora: '10:50',
            tipoVisita: '["test"]',
            veterinario: 'DEBUG ROBOT',
            motivoConsulta: 'PRUEBA DE PERSISTENCIA',
            diagnostico: 'OK',
            tratamiento: 'NINGUNO',
            estado: 'activo'
        }
    });
    console.log('Creado test con ID:', testHist.id_historial);

    const count1 = await prisma.historial_mascotas.count();
    console.log('Conteo tras inserción:', count1);

    console.log('Esperando 5 segundos...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    const count2 = await prisma.historial_mascotas.count();
    console.log('Conteo tras espera:', count2);

    if (count1 !== count2) {
        console.error('!!! LOS DATOS SE HAN BORRADO SOLOS !!!');
    } else {
        console.log('Datos persistentes.');
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
