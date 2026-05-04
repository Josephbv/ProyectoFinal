const http = require('http');

const payload = JSON.stringify({
    Nombre: "Clavel",
    TipoDocumento: "CC",
    Cedula: "1234567890",
    Correo: "a@a.com",
    Telefono: "---",
    Direccion: "---"
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/clientes',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Body: ${body}`);
    });
});

req.on('error', (e) => console.error(e.message));
req.write(payload);
req.end();
