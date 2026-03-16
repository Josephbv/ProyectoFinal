import prisma from './src/prismaClient';
import { sendWelcomeEmail } from './src/services/mail.service';
import crypto from 'crypto';

async function testCreateClient() {
    const nombre = "Test Client " + Date.now();
    const correo = "josephballestas10@gmail.com";
    const cedula = "TEST" + Date.now();

    console.log("Creando cliente...");
    const nuevoCliente = await prisma.cliente.create({
        data: { nombre, correo, cedula }
    });
    console.log("Cliente creado:", nuevoCliente.id_cliente);

    let tokenActivacion = crypto.randomUUID();
    console.log("Token:", tokenActivacion);

    await prisma.usuario.create({
        data: {
            nombre_usuario: nombre,
            correo,
            cedula,
            contrasena: '',
            token_recuperacion: tokenActivacion,
            id_rol: 4, // Cliente
            id_cliente: nuevoCliente.id_cliente,
            activo: true
        }
    });
    console.log("Usuario creado.");

    await sendWelcomeEmail(correo, nombre, tokenActivacion);
    console.log("Proceso terminado.");
}

testCreateClient().finally(() => prisma.$disconnect());
