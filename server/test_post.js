const http = require('http');

const data = JSON.stringify({
    id_mascota: 11,
    fecha: "2026-03-04",
    hora: "11:30",
    tipoVisita: "consulta",
    veterinario: "NODE TEST",
    motivoConsulta: "TEST POST 18",
    estado: "activo"
});

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/historial',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('STATUS:', res.statusCode);
        console.log('BODY:', body);
    });
});

req.on('error', (e) => {
    console.error('ERROR:', e.message);
});

req.write(data);
req.end();
