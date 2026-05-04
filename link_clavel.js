const http = require('http');

const payload = JSON.stringify({
    IdUsuario: 49,
    IdCliente: 31,
    // Keep other fields
    NombreUsuario: "Clavel",
    Estado: "pendiente",
    Activo: false
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/users/49',
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
