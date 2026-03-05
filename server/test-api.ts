import fetch from 'node-fetch';

async function testAPI() {
    console.log('--- TEST DE RESPUESTA API ---');
    try {
        console.log('Consultando: http://localhost:3000/api/clientes');
        const resp = await fetch('http://localhost:3000/api/clientes');
        console.log('Status:', resp.status);
        const data = await resp.json();
        console.log('Datos recibidos (Clientes):', JSON.stringify(data, null, 2));

        console.log('\nConsultando: http://localhost:3000/api/mascotas');
        const respM = await fetch('http://localhost:3000/api/mascotas');
        console.log('Status:', respM.status);
        const dataM = await respM.json();
        console.log('Datos recibidos (Mascotas):', JSON.stringify(dataM, null, 2));
    } catch (error) {
        console.error('ERROR EN TEST API:', error);
    }
}

testAPI();
