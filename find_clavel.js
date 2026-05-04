const http = require('http');

http.get('http://localhost:3000/api/auth/users', res => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
        const users = JSON.parse(body);
        const clavel = users.find(u => u && u.nombreUsuario && u.nombreUsuario.trim() === 'Clavel');
        if (clavel) {
            console.log('ID:', clavel.idUsuario);
            console.log('Name:', clavel.nombreUsuario);
            console.log('ClientID:', clavel.idCliente);
            console.log('Cedula:', clavel.cedula);
        } else {
            console.log('Clavel not found exactly.');
            users.forEach(u => u && console.log(`'${u.nombreUsuario}'`));
        }
    });
});
