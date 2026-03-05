const fetch = require('node-fetch');

async function testPost() {
    const payload = {
        id_mascota: 11,
        fecha: new Date().toISOString().split('T')[0],
        hora: "11:15",
        tipoVisita: ["consulta"],
        veterinario: "DR. TEST",
        motivoConsulta: "Prueba de depuración JSON",
        sintomas: "[]",
        diagnostico: "Diagnóstico de prueba",
        tratamiento: "Tratamiento de prueba",
        peso: 10,
        temperatura: 38,
        frecuenciaCardiaca: 80,
        frecuenciaRespiratoria: 20,
        estado: "completado"
    };

    console.log('Enviando payload:', JSON.stringify(payload, null, 2));

    try {
        const response = await fetch('http://localhost:3001/api/historial', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Cuerpo de respuesta (texto):', text);

        try {
            const json = JSON.parse(text);
            console.log('Respuesta parseada:', JSON.stringify(json, null, 2));
        } catch (e) {
            console.error('Error al parsear JSON:', e.message);
        }
    } catch (error) {
        console.error('Error de red:', error.message);
    }
}

testPost();
