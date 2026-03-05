require('dotenv').config();
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmails() {
    const email = 'josephballestas10@gmail.com';
    console.log('--- INICIANDO PRUEBA DE CORREOS KAI VET ---');
    console.log('Usando API Key:', process.env.RESEND_API_KEY ? 'Cargada correctamente' : 'No encontrada');

    try {
        // Prueba 1: Bienvenida
        console.log('Enviando correo de bienvenida...');
        const welcome = await resend.emails.send({
            from: 'KaiVet Manager <onboarding@resend.dev>',
            to: email,
            subject: 'PRUEBA: ¡Bienvenido a KaiVet Manager! 🐾',
            html: `<h1 style="color: #6366f1;">¡Hola Joseph!</h1><p>Esta es una prueba de tu nuevo sistema de correos profesionales.</p>`
        });
        console.log('Respuesta bienvenida:', welcome);

        // Prueba 2: Código
        console.log('\nEnviando código de recuperación...');
        const code = await resend.emails.send({
            from: 'Seguridad KaiVet <onboarding@resend.dev>',
            to: email,
            subject: 'PRUEBA: Código de seguridad 🔐',
            html: `<h2>Tu código es: 123456</h2><p>Válido por 10 minutos.</p>`
        });
        console.log('Respuesta código:', code);

        console.log('\n--- PRUEBA FINALIZADA CON ÉXITO ---');
    } catch (err) {
        console.error('\n❌ ERROR DURANTE LA PRUEBA:', err);
    }
}

testEmails();
