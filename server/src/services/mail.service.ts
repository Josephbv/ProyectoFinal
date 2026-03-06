import nodemailer from 'nodemailer';
import 'dotenv/config';

// Función para obtener el transportador de forma segura (Lazy initialization)
const getTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('[MAIL] ERROR: Credenciales de EMAIL no encontradas en el sistema.');
    throw new Error('Credenciales de correo no configuradas');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendWelcomeEmail = async (email: string, nombre: string) => {
  try {
    console.log(`[MAIL] Intentando enviar email de bienvenida a: ${email}`);

    await getTransporter().sendMail({
      from: `"Kaivet Manager" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '¡Bienvenido a Kaivet Manager! 🐾',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #111827; color: white; padding: 40px; border-radius: 12px; border: 1px solid #374151;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #6366f1; margin: 0; font-size: 28px;">Kaivet Manager</h1>
            <p style="color: #9ca3af; margin-top: 5px;">Tu plataforma de confianza para el cuidado de mascotas</p>
          </div>
          
          <h2 style="color: #f3f4f6; margin-bottom: 20px;">¡Hola, ${nombre}! 👋</h2>
          
          <p style="color: #d1d5db; line-height: 1.6; font-size: 16px;">
            Es un gusto darte la bienvenida a nuestra comunidad. Tu cuenta ha sido creada exitosamente y ya puedes acceder a todas nuestras funcionalidades.
          </p>
          
          <div style="background-color: #1f2937; padding: 25px; border-radius: 8px; margin: 30px 0; border: 1px solid #4b5563;">
            <p style="color: #e5e7eb; margin: 0 0 10px 0; font-weight: bold;">¿Qué puedes hacer ahora?</p>
            <ul style="color: #9ca3af; padding-left: 20px; line-height: 1.8;">
              <li>Gestionar el historial de tus mascotas</li>
              <li>Agendar citas médicas</li>
              <li>Consultar tus servicios y facturas</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 35px;">
            <a href="http://localhost:3000" style="background-color: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Acceder a mi cuenta</a>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #374151; margin: 40px 0;">
          
          <p style="color: #6b7280; font-size: 12px; text-align: center;">
            Este es un correo automático, por favor no respondas a este mensaje.<br>
            Kaivet Manager © 2026 - Control y salud para tus mejores amigos.
          </p>
        </div>
      `
    });
    console.log(`[MAIL] Correo de bienvenida enviado exitosamente a: ${email}`);
  } catch (error: any) {
    console.error('[MAIL] ERROR CRÍTICO AL ENVIAR BIENVENIDA:', error.message || error);
  }
};

export const sendResetCodeEmail = async (email: string, code: string) => {
  try {
    console.log(`[MAIL] Enviando código [${code}] a: ${email}`);

    await getTransporter().sendMail({
      from: `"Seguridad Kaivet" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Código de recuperación de contraseña 🔐',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #111827; color: white; padding: 40px; border-radius: 12px; border: 1px solid #374151;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #ef4444; margin: 0; font-size: 24px;">Seguridad de Cuenta</h1>
            </div>
            
            <h2 style="color: #f3f4f6; margin-bottom: 20px;">Recuperación de Contraseña</h2>
            
            <p style="color: #d1d5db; line-height: 1.6; font-size: 16px;">
                Has solicitado restablecer tu contraseña. Utiliza el siguiente código de seguridad para continuar:
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
                <div style="background-color: #1f2937; padding: 20px; border-radius: 8px; border: 2px dashed #4b5563; display: inline-block;">
                    <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #f3f4f6;">${code}</span>
                </div>
                <p style="color: #9ca3af; font-size: 14px; margin-top: 15px;">Este código expirará en 10 minutos.</p>
            </div>
            
            <p style="color: #ef4444; font-size: 14px; background-color: rgba(239, 68, 68, 0.1); padding: 15px; border-radius: 6px;">
                <strong>Importante:</strong> Si no solicitaste este cambio, ignora este correo y asegúrate de que tu cuenta esté segura.
            </p>
            
            <hr style="border: 0; border-top: 1px solid #374151; margin: 40px 0;">
            
            <p style="color: #6b7280; font-size: 12px; text-align: center;">
                Kaivet Manager © 2026 - Seguridad y Privacidad
            </p>
        </div>
      `
    });
    console.log(`[MAIL] Código enviado exitosamente a: ${email}`);
  } catch (error: any) {
    console.error('[MAIL] ERROR AL ENVIAR CÓDIGO:', error.message || error);
  }
};
