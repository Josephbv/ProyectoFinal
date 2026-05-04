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
            console.log('--- Users List ---');
            users.forEach(u => {
                console.log(JSON.stringify(u, null, 2));
            });
        } catch (e) {
            console.error('Error parsing response:', e.message);
        }
    });
});

req.on('error', (e) => console.error('Error fetching users:', e.message));
req.end();
