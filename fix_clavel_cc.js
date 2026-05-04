const http = require('http');

const payload = JSON.stringify({
    IdCliente: 31,
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
    path: '/api/clientes/31',
    method: 'PUT',
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
