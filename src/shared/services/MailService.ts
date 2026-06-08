/**
 * Servicio para envío de correos electrónicos (Mock frontend - los correos se envían desde el Backend)
 */

export const MailService = {
  sendWelcomeEmail: async (toEmail: string, toName: string) => {
    console.log("[MailService Mock] El backend se encarga de enviar el correo de bienvenida a:", toEmail);
    return { success: true };
  },

  sendAppointmentConfirmation: async (toEmail: string, toName: string, petName: string, date: string, time: string) => {
    console.log("[MailService Mock] El backend se encarga de enviar la confirmación de cita a:", toEmail);
    return { success: true };
  }
};
