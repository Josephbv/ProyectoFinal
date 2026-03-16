import https from 'https';
import 'dotenv/config';

const apiKey = process.env.EMAIL_PASS;
const data = {
    sender: { name: 'Test', email: 'josephballestas10@gmail.com' },
    to: [{ email: 'josephballestas10@gmail.com' }],
    subject: 'Raw Test',
    htmlContent: '<h1>Raw Test</h1>'
};

const postData = JSON.stringify(data);
const options = {
    hostname: 'api.brevo.com',
    port: 443,
    path: '/v3/smtp/email',
    method: 'POST',
    headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(postData)
    }
};

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (d) => body += d);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Body:', body);
    });
});

req.on('error', (e) => console.error('Error:', e));
req.write(postData);
req.end();
