import 'dotenv/config';
// Usamos require y any para saltar los errores de tipos de la librería de Brevo que bloquean el build
const sib = require('@getbrevo/brevo');

/**
 * Servicio de envío de correo mediante la API de Brevo (Sendinblue).
 */
const getBrevoApi = () => {
  const apiKey = process.env.EMAIL_PASS;
  if (!apiKey) {
    console.warn('[MAIL] ERROR: No se encontró la API Key de Brevo.');
    return null;
  }

  try {
    const apiInstance = new sib.TransactionalEmailsApi();
    // En la versión actual de @getbrevo/brevo, esto se asocia así:
    apiInstance.setApiKey(sib.TransactionalEmailsApiApiKeys.apiKey, apiKey);
    return apiInstance;
  } catch (error) {
    console.error('[MAIL] Error al instanciar API de Brevo:', error);
    return null;
  }
};

const FROM_EMAIL = process.env.EMAIL_USER || "josephballestas10@gmail.com";
const FROM_NAME = "KaiVet Manager";

export const sendWelcomeEmail = async (email: string, nombre: string, tokenActivacion?: string) => {
  try {
    console.log(`[MAIL-API] Intentando enviar email de bienvenida a: ${email}`);

    const apiInstance = getBrevoApi();
    if (!apiInstance) return;

    const sendSmtpEmail = new sib.SendSmtpEmail();
    sendSmtpEmail.subject = "¡Bienvenido a KaiVet Manager! 🐾";
    sendSmtpEmail.sender = { name: FROM_NAME, email: FROM_EMAIL };
    sendSmtpEmail.to = [{ email: email, name: nombre }];

    const activationLink = tokenActivacion
      ? `https://proyectofinal-production-2000.up.railway.app/?mode=activate&email=${encodeURIComponent(email)}&token=${tokenActivacion}`
      : `https://proyectofinal-production-2000.up.railway.app`;

    sendSmtpEmail.htmlContent = `
            <div style="font-family: Arial, sans-serif; background-color: #020617; color: white; padding: 40px; border-radius: 20px;">
                <h1 style="color: #3b82f6; text-align: center;">¡Bienvenido a KaiVet, ${nombre}! 👋</h1>
                <p style="font-size: 16px; color: #94a3b8; text-align: center;">Tu cuenta ha sido creada con éxito en nuestra plataforma de gestión veterinaria.</p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${activationLink}" style="background-color: #3b82f6; color: white; padding: 15px 25px; text-decoration: none; border-radius: 10px; font-weight: bold;">
                        ${tokenActivacion ? 'Activar mi cuenta y crear contraseña' : 'Ir al Portal'}
                    </a>
                </div>
            </div>
        `;

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`[MAIL-API] Correo de bienvenida enviado exitosamente a: ${email}`);
  } catch (error: any) {
    console.error('[MAIL-API] ERROR AL ENVIAR:', error.response?.body || error.message);
  }
};

export const sendResetCodeEmail = async (email: string, code: string) => {
  try {
    const apiInstance = getBrevoApi();
    if (!apiInstance) return;

    const sendSmtpEmail = new sib.SendSmtpEmail();
    sendSmtpEmail.subject = "Código de recuperación de contraseña 🔐";
    sendSmtpEmail.sender = { name: FROM_NAME, email: FROM_EMAIL };
    sendSmtpEmail.to = [{ email: email }];
    sendSmtpEmail.htmlContent = `
            <div style="font-family: sans-serif; background-color: #020617; color: white; padding: 40px; border-radius: 20px;">
                <h2 style="color: #3b82f6; text-align: center;">Recuperación de Acceso</h2>
                <div style="text-align: center; margin: 30px 0;">
                    <div style="background-color: #1e293b; padding: 20px; border-radius: 10px; border: 2px dashed #3b82f6; display: inline-block;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px;">${code}</span>
                    </div>
                </div>
            </div>
        `;

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`[MAIL-API] Código de recuperación enviado a: ${email}`);
  } catch (error: any) {
    console.error('[MAIL-API] ERROR AL ENVIAR CÓDIGO:', error.response?.body || error.message);
  }
};
