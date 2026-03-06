require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmails() {
    console.log('--- INICIANDO PRUEBA DE CORREOS (PLAN B - GMAIL) ---');
    console.log('Remitente:', process.env.EMAIL_USER);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const email = 'josephballestas10@gmail.com';

    try {
        console.log('Enviando correo de prueba...');
        const info = await transporter.sendMail({
            from: `"Kaivet Test" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'PRUEBA PLAN B: ¡Funciona! 🐾',
            html: `<h1>¡Hola Joseph!</h1><p>Si recibes esto, el Plan B (Gmail) está configurado correctamente y ya puedes enviar correos a cualquier cliente.</p>`
        });

        console.log('✅ Correo enviado con éxito!');
        console.log('ID del mensaje:', info.messageId);
        console.log('\n--- PRUEBA FINALIZADA CON ÉXITO ---');
    } catch (err) {
        console.error('\n❌ ERROR DURANTE LA PRUEBA:', err.message);
        console.log('\nAYUDA: Asegúrate de usar una "Contraseña de Aplicación" de 16 letras, no tu contraseña normal de Gmail.');
    }
}

testEmails();
