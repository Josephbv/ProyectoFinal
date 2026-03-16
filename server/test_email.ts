import { sendWelcomeEmail } from './src/services/mail.service';

async function test() {
    console.log("Iniciando prueba de envío...");
    await sendWelcomeEmail('josephballestas10@gmail.com', 'Prueba Joseph', 'test-token');
    console.log("Prueba finalizada.");
}

test();
