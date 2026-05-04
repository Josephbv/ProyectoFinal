const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/users',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        try {
            const users = JSON.parse(body);
            const clavel = users.find(u => u && u.nombreUsuario && u.nombreUsuario.includes('Clavel'));
            if (clavel) {
                console.log('--- Clavel Details ---');
                console.log(JSON.stringify(clavel, null, 2));
            } else {
                console.log('Clavel not found in users list');
                // Log all names
                users.forEach(u => u && console.log(u.nombreUsuario));
            }
        } catch (e) {
            console.error('Error parsing response:', e.message);
        }
    });
});

req.on('error', (e) => console.error('Error fetching users:', e.message));
req.end();
