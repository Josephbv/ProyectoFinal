const http = require('http');

const payload = JSON.stringify({
    Nombre: "Clavel",
    TipoDocumento: "CC",
    Cedula: "1234567890-TEMP",
    Correo: "clavel@example.com",
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
    let b = '';
    res.on('data', d => b += d);
    res.on('end', () => {
        console.log(res.statusCode, b);
    });
});

req.write(payload);
req.end();
