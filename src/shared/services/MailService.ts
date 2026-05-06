/**
 * Servicio para envío de correos electrónicos a través de la API de Brevo
 */

const BREVO_API_KEY = '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';
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

export const MailService = {
  /**
   * Envía un correo de bienvenida a un nuevo usuario
   */
  sendWelcomeEmail: async (toEmail: string, toName: string) => {
    try {
      const response = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': BREVO_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: {
            name: "KaiVet Manager",
            email: "kaivetmanager@gmail.com"
          },
          to: [{ email: toEmail, name: toName }],
          subject: "¡Bienvenido a la familia KaiVet! 🐾",
          htmlContent: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
              <div style="background: #3b82f6; padding: 40px 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">KaiVet Manager</h1>
              </div>
              <div style="padding: 40px 30px; background: white;">
                <h2>¡Hola, ${toName}! 🐾</h2>
                <p>Es un placer darte la bienvenida a <strong>KaiVet Manager</strong>. Estamos emocionados de acompañarte en el cuidado de tus mascotas.</p>
                <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                  <strong>¿Qué puedes hacer ahora?</strong>
                  <ul>
                    <li>Registrar a tus mascotas.</li>
                    <li>Agendar citas médicas.</li>
                    <li>Ver el historial de salud.</li>
                  </ul>
                </div>
              </div>
              <div style="background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
                <p>© 2026 KaiVet Manager</p>
              </div>
            </div>
          `
        })
      });
      return { success: response.ok };
    } catch (error) {
      return { success: false, error };
    }
  },

  /**
   * Envía confirmación de cita agendada
   */
  sendAppointmentConfirmation: async (toEmail: string, toName: string, petName: string, date: string, time: string) => {
    try {
      const response = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': BREVO_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: {
            name: "Citas KaiVet",
            email: "kaivetmanager@gmail.com"
          },
          to: [{ email: toEmail, name: toName }],
          subject: `Cita Confirmada: ¡Nos vemos pronto con ${petName || 'tu mascota'}! 🗓️`,
          htmlContent: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
              <div style="background: #10b981; padding: 40px 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Cita Confirmada</h1>
                <p style="color: white; opacity: 0.9;">KaiVet Medical Staff</p>
              </div>
              <div style="padding: 40px 30px; background: white;">
                <h2>¡Hola, ${toName}!</h2>
                <p>Te confirmamos que hemos agendado exitosamente la siguiente cita:</p>
                
                <div style="background: #f0fdf4; padding: 25px; border-radius: 16px; margin: 25px 0; border: 1px solid #bbf7d0;">
                  <table style="width: 100%;">
                    <tr>
                      <td style="color: #166534; font-weight: bold; padding-bottom: 10px;">🐾 Mascota:</td>
                      <td style="padding-bottom: 10px;">${petName || 'Tu mascota'}</td>
                    </tr>
                    <tr>
                      <td style="color: #166534; font-weight: bold; padding-bottom: 10px;">📅 Fecha:</td>
                      <td style="padding-bottom: 10px;">${date}</td>
                    </tr>
                    <tr>
                      <td style="color: #166534; font-weight: bold;">⏰ Hora:</td>
                      <td>${time}</td>
                    </tr>
                  </table>
                </div>

                <p style="font-size: 14px; color: #64748b; font-style: italic;">
                  * Te recomendamos llegar 10 minutos antes de tu cita. Si necesitas cancelar o reprogramar, por favor hazlo desde tu panel con al menos 24 horas de anticipación.
                </p>
              </div>
              <div style="background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
                <p>© 2026 KaiVet Manager - Pasión por la vida animal</p>
              </div>
            </div>
          `
        })
      });
      return { success: response.ok };
    } catch (error) {
      return { success: false, error };
    }
  }
};
