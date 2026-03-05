const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    console.log('--- TEST INSERTION ---');
    const testHist = await prisma.historial_mascotas.create({
        data: {
            id_mascota: 11,
            fecha: new Date(),
            hora: '11:00',
            tipoVisita: '["test"]',
            veterinario: 'DEBUG ROBOT',
            motivoConsulta: 'PRUEBA DE PERSISTENCIA DEFINITIVA',
            diagnostico: 'OK',
            tratamiento: 'NINGUNO',
            estado: 'activo'
        }
    });
    console.log('Creado test con ID:', testHist.id_historial);

    const h = await prisma.historial_mascotas.findUnique({
        where: { id_historial: testHist.id_historial }
    });
    console.log('Verificación inmediata:', h ? 'Encontrado' : 'FALLO');

    console.log('Esperando 10 segundos para ver si desaparece...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    const h2 = await prisma.historial_mascotas.findUnique({
        where: { id_historial: testHist.id_historial }
    });
    console.log('Verificación posterior:', h2 ? 'Continúa ahí' : 'HA DESAPARECIDO');
}
main().catch(console.error).finally(() => prisma.$disconnect());
