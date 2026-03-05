const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const data = {
            id_mascota: 4,
            fecha: new Date(),
            hora: '10:00',
            tipoVisita: JSON.stringify(['consulta']),
            veterinario: 'Dr. Script',
            motivoConsulta: 'Prueba desde script',
            diagnostico: 'OK',
            tratamiento: 'Ninguno',
            peso: 10,
            temperatura: 38,
            frecuenciaCardiaca: 80,
            frecuenciaRespiratoria: 20,
            estado: 'activo'
        };

        console.log('Attempting to create with data:', JSON.stringify(data, null, 2));
        const nueva = await prisma.historial_mascotas.create({ data });
        console.log('Created successfully:', nueva.id_historial);

    } catch (error) {
        console.error('Error during creation:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
