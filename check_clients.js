const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/clientes',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        try {
            const clients = JSON.parse(body);
            console.log('--- Clients List ---');
            clients.forEach(c => {
                console.log(`ID: ${c.idCliente || c.id_cliente}, Name: ${c.nombre || c.Nombre}, Email: ${c.correo || c.Correo}`);
            });
        } catch (e) {
            console.error('Error parsing response:', e.message);
            console.log('Raw body:', body);
        }
    });
});

req.on('error', (e) => console.error('Error fetching clients:', e.message));
req.end();
