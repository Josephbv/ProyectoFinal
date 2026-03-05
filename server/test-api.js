const http = require('http');

function get(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject('Error parsing JSON: ' + data.substring(0, 100));
                }
            });
        }).on('error', (err) => reject(err));
    });
}

async function run() {
    console.log('--- TEST DE API (NATIVO) ---');
    try {
        const clientes = await get('http://localhost:3000/api/clientes');
        console.log('Clientes:', JSON.stringify(clientes, null, 2).substring(0, 500));

        const mascotas = await get('http://localhost:3000/api/mascotas');
        console.log('Mascotas:', JSON.stringify(mascotas, null, 2).substring(0, 500));
    } catch (e) {
        console.error('ERROR:', e);
    }
}

run();
