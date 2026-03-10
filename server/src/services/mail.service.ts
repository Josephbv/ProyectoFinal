import nodemailer from 'nodemailer';
import 'dotenv/config';

// Configuración del transportador de correo (SMTP)
const getTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    console.warn('[MAIL] WARNING: EMAIL_USER o EMAIL_PASS no encontrados en .env. El sistema usará el modo simulado.');
    return null;
  }

  // Configuración para Gmail (u otros servicios SMTP)
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
};

const FROM_EMAIL = `"KaiVet Manager" <${process.env.EMAIL_USER}>`;

export const sendWelcomeEmail = async (email: string, nombre: string, tokenActivacion?: string) => {
  try {
    console.log(`[MAIL] Intentando enviar email de bienvenida a: ${email}`);

    const welcomeHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: 'Inter', -apple-system, sans-serif; background-color: #020617; color: #f8fafc; margin: 0; padding: 0; }
                        .container { max-width: 600px; margin: 40px auto; padding: 40px; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(148, 163, 184, 0.1); border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
                        .logo { text-align: center; margin-bottom: 30px; font-size: 40px; }
                        h1 { color: #3b82f6; text-align: center; font-size: 28px; font-weight: 800; margin-bottom: 8px; }
                        p { font-size: 16px; line-height: 1.6; color: #94a3b8; }
                        .welcome-text { color: #f8fafc; font-size: 20px; font-weight: 600; text-align: center; margin: 30px 0; }
                        .features { background: rgba(30, 41, 59, 0.5); padding: 25px; border-radius: 16px; margin: 30px 0; border: 1px solid rgba(59, 130, 246, 0.2); }
                        .feature-item { display: flex; align-items: center; margin-bottom: 12px; color: #e2e8f0; }
                        .feature-icon { margin-right: 12px; color: #3b82f6; }
                        .cta-container { text-align: center; margin-top: 40px; }
                        .cta-button { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 16px 40px; border-radius: 14px; text-decoration: none; font-weight: bold; display: inline-block; transition: all 0.3s; }
                        .footer { margin-top: 50px; text-align: center; border-top: 1px solid rgba(148, 163, 184, 0.1); padding-top: 30px; color: #64748b; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="logo">🐾</div>
                        <h1>KaiVet Manager</h1>
                        <p style="text-align: center; color: #64748b; margin-top: 0;">Gestión Veterinaria de Nueva Generación</p>
                        
                        <div class="welcome-text">¡Hola, ${nombre}! 👋</div>
                        
                        <p>Es un gusto darte la bienvenida. Tu cuenta ha sido activada y ya tienes acceso a todas nuestras herramientas profesionales para el cuidado de tus pacientes.</p>
                        
                        <div class="features">
                            <div class="feature-item"><span class="feature-icon">✓</span> Historial clínico digital detallado</div>
                            <div class="feature-item"><span class="feature-icon">✓</span> Agenda inteligente de citas</div>
                            <div class="feature-item"><span class="feature-icon">✓</span> Control de ventas y stock</div>
                            <div class="feature-item"><span class="feature-icon">✓</span> Recordatorios automáticos</div>
                        </div>
                        
                        <div class="cta-container">
                            ${tokenActivacion
        ? `<a href="https://proyectofinal-production-2000.up.railway.app/?mode=activate&email=${encodeURIComponent(email)}&token=${tokenActivacion}" class="cta-button">Activar mi cuenta y crear contraseña</a>`
        : `<a href="https://proyectofinal-production-2000.up.railway.app" class="cta-button">Acceder a mi Portal</a>`}
                        </div>
                        
                        <div class="footer">
                            <p>Este es un correo automático de bienvenida.<br>
                            © 2026 KaiVet Manager - Potenciando el cuidado animal.</p>
                        </div>
                    </div>
                </body>
                </html>
            `;

    const transporter = getTransporter();
    if (!transporter) {
      console.log('📧 [MODO SIMULADO] Email de bienvenida para:', nombre, `(${email})`);
      if (tokenActivacion) console.log(`   -> Activación: http://localhost:3000/?mode=activate&email=${encodeURIComponent(email)}&token=${tokenActivacion}`);
      return;
    }

    await transporter.sendMail({
      from: FROM_EMAIL,
      to: email,
      subject: '¡Bienvenido a KaiVet Manager! 🐾',
      html: welcomeHtml
    });
    console.log(`[MAIL] Correo de bienvenida enviado exitosamente a: ${email}`);
  } catch (error: any) {
    console.error('[MAIL] ERROR AL ENVIAR BIENVENIDA:', error.message || error);
  }
};

export const sendResetCodeEmail = async (email: string, code: string) => {
  try {
    console.log(`[MAIL] Intentando enviar código de recuperación a: ${email}`);

    const transporter = getTransporter();
    if (!transporter) {
      console.log('📧 [MODO SIMULADO] Código de recuperación para:', email, `CÓDIGO: ${code}`);
      return;
    }

    await transporter.sendMail({
      from: `"Seguridad KaiVet" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Código de recuperación de contraseña 🔐',
      html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #020617; color: white; padding: 40px; border-radius: 20px; border: 1px solid #1e293b;">
                    <h2 style="color: #3b82f6; text-align: center;">Recuperación de Acceso</h2>
                    <p style="color: #94a3b8; text-align: center;">Has solicitado restablecer tu contraseña. Utiliza el siguiente código:</p>
                    
                    <div style="text-align: center; margin: 40px 0;">
                        <div style="background-color: #1e293b; padding: 25px; border-radius: 12px; border: 2px dashed #3b82f6; display: inline-block;">
                            <span style="font-family: monospace; font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #f8fafc;">${code}</span>
                        </div>
                    </div>
                    
                    <p style="color: #ef4444; font-size: 13px; text-align: center;">
                        <strong>Importante:</strong> Este código expirará pronto. Si no solicitaste este cambio, por favor ignora este correo.
                    </p>
                </div>
            `
    });
    console.log(`[MAIL] Código enviado exitosamente a: ${email}`);
  } catch (error: any) {
    console.error('[MAIL] ERROR AL ENVIAR CÓDIGO:', error.message || error);
  }
};
