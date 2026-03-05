import { toast } from "sonner";

// Configuración del servicio de email
const EMAIL_CONFIG = {
  // Resend API Key - En producción, configurar desde variables de entorno del servidor
  // Para desarrollo local, cambiar por tu API key real aquí
  apiKey: 'demo_mode_placeholder', // Cambiar por tu API key real de Resend
  fromEmail: 'noreply@kaivetmanager.com', // Dominio verificado en Resend
  fromName: 'KaiVet Manager',
  replyTo: 'kaivetmanager@gmail.com'
};

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class EmailService {
  private static instance: EmailService;
  private apiKey: string;

  private constructor() {
    // Intentar obtener API key desde localStorage primero, luego desde config
    this.apiKey = this.getStoredApiKey() || EMAIL_CONFIG.apiKey;
  }

  // Obtener API key almacenada en localStorage
  private getStoredApiKey(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('kaivet_resend_api_key');
    }
    return null;
  }

  // Configurar nueva API key
  public setApiKey(newApiKey: string): void {
    this.apiKey = newApiKey;
    if (typeof window !== 'undefined') {
      if (newApiKey && newApiKey !== 'demo_mode_placeholder') {
        localStorage.setItem('kaivet_resend_api_key', newApiKey);
      } else {
        localStorage.removeItem('kaivet_resend_api_key');
      }
    }
  }

  // Obtener API key actual (enmascarada para seguridad)
  public getMaskedApiKey(): string {
    if (!this.apiKey || this.apiKey === 'demo_mode_placeholder') {
      return 'No configurada';
    }
    const key = this.apiKey;
    if (key.length > 8) {
      return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
    }
    return '****';
  }

  // Limpiar configuración
  public clearApiKey(): void {
    this.apiKey = 'demo_mode_placeholder';
    if (typeof window !== 'undefined') {
      localStorage.removeItem('kaivet_resend_api_key');
    }
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  // Template para código de verificación de login
  private getLoginTemplate(code: string, email: string): EmailTemplate {
    return {
      subject: '🔐 Código de verificación - KaiVet Manager',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Código de Verificación</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              margin: 0;
              padding: 0;
              background-color: #020617;
              color: #f8fafc;
            }
            .container { 
              max-width: 600px;
              margin: 0 auto;
              padding: 40px 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
            }
            .logo {
              width: 60px;
              height: 60px;
              background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
              border-radius: 16px;
              margin: 0 auto 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 24px;
              font-weight: bold;
            }
            .card {
              background: rgba(15, 23, 42, 0.8);
              backdrop-filter: blur(20px);
              border: 1px solid rgba(148, 163, 184, 0.1);
              border-radius: 16px;
              padding: 32px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            }
            .code-box {
              background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
              border: 2px solid #3b82f6;
              border-radius: 12px;
              padding: 24px;
              text-align: center;
              margin: 24px 0;
            }
            .code {
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              color: #3b82f6;
              font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
            }
            .warning {
              background: rgba(239, 68, 68, 0.1);
              border: 1px solid rgba(239, 68, 68, 0.3);
              border-radius: 8px;
              padding: 16px;
              margin: 24px 0;
              color: #fecaca;
            }
            .footer {
              text-align: center;
              margin-top: 32px;
              padding-top: 24px;
              border-top: 1px solid rgba(148, 163, 184, 0.1);
              color: #94a3b8;
              font-size: 14px;
            }
            .btn {
              display: inline-block;
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              color: white;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-weight: 600;
              margin: 16px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🐾</div>
              <h1 style="color: #f8fafc; margin: 0;">KaiVet Manager</h1>
              <p style="color: #94a3b8; margin: 8px 0 0;">Gestión Veterinaria de Nueva Generación</p>
            </div>
            
            <div class="card">
              <h2 style="color: #f8fafc; margin-top: 0;">Código de Verificación</h2>
              <p style="color: #94a3b8;">Hola,</p>
              <p style="color: #94a3b8;">Has solicitado acceder a tu cuenta de KaiVet Manager. Usa el siguiente código de verificación:</p>
              
              <div class="code-box">
                <div class="code">${code}</div>
                <p style="color: #94a3b8; margin: 12px 0 0; font-size: 14px;">Este código expira en 10 minutos</p>
              </div>
              
              <p style="color: #94a3b8;">Si no solicitaste este código, puedes ignorar este correo de forma segura.</p>
              
              <div class="warning">
                <strong>⚠️ Importante:</strong> Nunca compartas este código con nadie. El equipo de KaiVet Manager nunca te pedirá tu código de verificación.
              </div>
            </div>
            
            <div class="footer">
              <p>Este correo fue enviado desde KaiVet Manager</p>
              <p>Si tienes problemas, contacta a: <a href="mailto:kaivetmanager@gmail.com" style="color: #3b82f6;">kaivetmanager@gmail.com</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
KaiVet Manager - Código de Verificación

Hola,

Has solicitado acceder a tu cuenta de KaiVet Manager.

Tu código de verificación es: ${code}

Este código expira en 10 minutos.

Si no solicitaste este código, puedes ignorar este correo de forma segura.

IMPORTANTE: Nunca compartas este código con nadie.

---
KaiVet Manager
Gestión Veterinaria de Nueva Generación
kaivetmanager@gmail.com
      `
    };
  }

  // Template para recuperación de contraseña
  private getPasswordResetTemplate(code: string, email: string): EmailTemplate {
    return {
      subject: '🔑 Recuperación de contraseña - KaiVet Manager',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Recuperación de Contraseña</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              margin: 0;
              padding: 0;
              background-color: #020617;
              color: #f8fafc;
            }
            .container { 
              max-width: 600px;
              margin: 0 auto;
              padding: 40px 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
            }
            .logo {
              width: 60px;
              height: 60px;
              background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
              border-radius: 16px;
              margin: 0 auto 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 24px;
              font-weight: bold;
            }
            .card {
              background: rgba(15, 23, 42, 0.8);
              backdrop-filter: blur(20px);
              border: 1px solid rgba(148, 163, 184, 0.1);
              border-radius: 16px;
              padding: 32px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            }
            .code-box {
              background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
              border: 2px solid #f59e0b;
              border-radius: 12px;
              padding: 24px;
              text-align: center;
              margin: 24px 0;
            }
            .code {
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              color: #f59e0b;
              font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
            }
            .warning {
              background: rgba(239, 68, 68, 0.1);
              border: 1px solid rgba(239, 68, 68, 0.3);
              border-radius: 8px;
              padding: 16px;
              margin: 24px 0;
              color: #fecaca;
            }
            .info {
              background: rgba(6, 182, 212, 0.1);
              border: 1px solid rgba(6, 182, 212, 0.3);
              border-radius: 8px;
              padding: 16px;
              margin: 24px 0;
              color: #a7f3d0;
            }
            .footer {
              text-align: center;
              margin-top: 32px;
              padding-top: 24px;
              border-top: 1px solid rgba(148, 163, 184, 0.1);
              color: #94a3b8;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🐾</div>
              <h1 style="color: #f8fafc; margin: 0;">KaiVet Manager</h1>
              <p style="color: #94a3b8; margin: 8px 0 0;">Gestión Veterinaria de Nueva Generación</p>
            </div>
            
            <div class="card">
              <h2 style="color: #f8fafc; margin-top: 0;">🔑 Recuperación de Contraseña</h2>
              <p style="color: #94a3b8;">Hola,</p>
              <p style="color: #94a3b8;">Has solicitado restablecer tu contraseña de KaiVet Manager. Usa el siguiente código para continuar:</p>
              
              <div class="code-box">
                <div class="code">${code}</div>
                <p style="color: #94a3b8; margin: 12px 0 0; font-size: 14px;">Este código expira en 15 minutos</p>
              </div>
              
              <div class="info">
                <strong>ℹ️ Próximos pasos:</strong>
                <ol style="margin: 8px 0 0; padding-left: 20px;">
                  <li>Ingresa este código en KaiVet Manager</li>
                  <li>Crea una nueva contraseña segura</li>
                  <li>Confirma tu nueva contraseña</li>
                </ol>
              </div>
              
              <p style="color: #94a3b8;">Si no solicitaste este restablecimiento, puedes ignorar este correo. Tu contraseña actual seguirá siendo válida.</p>
              
              <div class="warning">
                <strong>⚠️ Seguridad:</strong> Este código es de un solo uso y expira automáticamente. Nunca lo compartas con nadie.
              </div>
            </div>
            
            <div class="footer">
              <p>Este correo fue enviado desde KaiVet Manager</p>
              <p>¿Necesitas ayuda? Contacta a: <a href="mailto:kaivetmanager@gmail.com" style="color: #3b82f6;">kaivetmanager@gmail.com</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
KaiVet Manager - Recuperación de Contraseña

Hola,

Has solicitado restablecer tu contraseña de KaiVet Manager.

Tu código de recuperación es: ${code}

Este código expira en 15 minutos.

Próximos pasos:
1. Ingresa este código en KaiVet Manager
2. Crea una nueva contraseña segura
3. Confirma tu nueva contraseña

Si no solicitaste este restablecimiento, puedes ignorar este correo.

SEGURIDAD: Este código es de un solo uso y nunca debe ser compartido.

---
KaiVet Manager
Gestión Veterinaria de Nueva Generación
kaivetmanager@gmail.com
      `
    };
  }

  // Template para registro exitoso
  private getWelcomeTemplate(code: string, email: string): EmailTemplate {
    return {
      subject: '🎉 ¡Bienvenido a KaiVet Manager!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bienvenido a KaiVet Manager</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              margin: 0;
              padding: 0;
              background-color: #020617;
              color: #f8fafc;
            }
            .container { 
              max-width: 600px;
              margin: 0 auto;
              padding: 40px 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
            }
            .logo {
              width: 60px;
              height: 60px;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              border-radius: 16px;
              margin: 0 auto 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 24px;
              font-weight: bold;
            }
            .card {
              background: rgba(15, 23, 42, 0.8);
              backdrop-filter: blur(20px);
              border: 1px solid rgba(148, 163, 184, 0.1);
              border-radius: 16px;
              padding: 32px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            }
            .code-box {
              background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
              border: 2px solid #10b981;
              border-radius: 12px;
              padding: 24px;
              text-align: center;
              margin: 24px 0;
            }
            .code {
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              color: #10b981;
              font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
            }
            .features {
              background: rgba(16, 185, 129, 0.1);
              border: 1px solid rgba(16, 185, 129, 0.3);
              border-radius: 8px;
              padding: 20px;
              margin: 24px 0;
            }
            .footer {
              text-align: center;
              margin-top: 32px;
              padding-top: 24px;
              border-top: 1px solid rgba(148, 163, 184, 0.1);
              color: #94a3b8;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🐾</div>
              <h1 style="color: #f8fafc; margin: 0;">KaiVet Manager</h1>
              <p style="color: #94a3b8; margin: 8px 0 0;">Gestión Veterinaria de Nueva Generación</p>
            </div>
            
            <div class="card">
              <h2 style="color: #f8fafc; margin-top: 0;">🎉 ¡Bienvenido a KaiVet Manager!</h2>
              <p style="color: #94a3b8;">Gracias por registrarte en nuestra plataforma. Para completar tu registro, verifica tu cuenta con el siguiente código:</p>
              
              <div class="code-box">
                <div class="code">${code}</div>
                <p style="color: #94a3b8; margin: 12px 0 0; font-size: 14px;">Este código expira en 10 minutos</p>
              </div>
              
              <div class="features">
                <h3 style="color: #10b981; margin-top: 0;">✨ Lo que puedes hacer con KaiVet Manager:</h3>
                <ul style="color: #94a3b8; margin: 0; padding-left: 20px;">
                  <li>📊 Dashboard con métricas en tiempo real</li>
                  <li>💼 Gestión completa de clientes y mascotas</li>
                  <li>📅 Sistema de agendamiento inteligente</li>
                  <li>🏠 Servicios a domicilio</li>
                  <li>💰 Control de ventas y comprobantes</li>
                  <li>📦 Gestión de inventario e insumos</li>
                  <li>👥 Administración de usuarios y roles</li>
                </ul>
              </div>
              
              <p style="color: #94a3b8;">Una vez verificada tu cuenta, podrás acceder a todas las funcionalidades de nuestra plataforma.</p>
            </div>
            
            <div class="footer">
              <p>¡Gracias por confiar en KaiVet Manager!</p>
              <p>¿Tienes preguntas? Escríbenos a: <a href="mailto:kaivetmanager@gmail.com" style="color: #3b82f6;">kaivetmanager@gmail.com</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
KaiVet Manager - ¡Bienvenido!

¡Gracias por registrarte en KaiVet Manager!

Para completar tu registro, verifica tu cuenta con este código: ${code}

Este código expira en 10 minutos.

Con KaiVet Manager puedes:
- Dashboard con métricas en tiempo real
- Gestión completa de clientes y mascotas  
- Sistema de agendamiento inteligente
- Servicios a domicilio
- Control de ventas y comprobantes
- Gestión de inventario e insumos
- Administración de usuarios y roles

¡Gracias por confiar en nosotros!

---
KaiVet Manager
Gestión Veterinaria de Nueva Generación
kaivetmanager@gmail.com
      `
    };
  }

  // Enviar email usando Resend API
  public async sendEmail(
    to: string,
    type: 'login' | 'register' | 'reset',
    code: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Validar email
      if (!to || !this.isValidEmail(to)) {
        throw new Error('Email de destino inválido');
      }

      // Seleccionar template según el tipo
      let template: EmailTemplate;
      switch (type) {
        case 'login':
          template = this.getLoginTemplate(code, to);
          break;
        case 'register':
          template = this.getWelcomeTemplate(code, to);
          break;
        case 'reset':
          template = this.getPasswordResetTemplate(code, to);
          break;
        default:
          throw new Error('Tipo de email no válido');
      }

      // Preparar el payload para Resend
      const emailData = {
        from: `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.fromEmail}>`,
        to: [to],
        reply_to: EMAIL_CONFIG.replyTo,
        subject: template.subject,
        html: template.html,
        text: template.text,
        headers: {
          'X-Entity-Ref-ID': `kaivet-${type}-${Date.now()}`,
        },
        tags: [
          { name: 'category', value: 'authentication' },
          { name: 'type', value: type },
          { name: 'system', value: 'kaivet-manager' }
        ]
      };

      // En entorno de desarrollo, simular el envío
      if (this.isDevelopment()) {
        console.log('📧 [DESARROLLO] Email simulado enviado:');
        console.log('📧 Para:', to);
        console.log('📧 Asunto:', template.subject);
        console.log('📧 Código:', code);
        console.log('📧 Tipo:', type);
        
        // Simular delay de envío
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        return {
          success: true,
          messageId: `dev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
      }

      // Envío real usando Resend API
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('✅ Email enviado exitosamente:', result.id);
      
      return {
        success: true,
        messageId: result.id
      };

    } catch (error) {
      console.error('❌ Error al enviar email:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al enviar email'
      };
    }
  }

  // Validar formato de email
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Detectar si estamos en desarrollo
  private isDevelopment(): boolean {
    // Siempre intentar enviar emails reales si hay una API key válida
    if (this.apiKey && 
        !this.apiKey.includes('placeholder') && 
        !this.apiKey.includes('demo_mode') &&
        this.apiKey.length >= 20) {
      return false; // Si hay API key válida, usar envío real
    }
    
    // Solo simular si no hay API key configurada
    return true;
  }

  // Método público para testear el servicio
  public async testEmailService(): Promise<{ success: boolean; message: string }> {
    try {
      const testCode = '123456';
      const testEmail = 'kaivetmanager@gmail.com';
      
      const result = await this.sendEmail(testEmail, 'login', testCode);
      
      if (result.success) {
        return {
          success: true,
          message: `✅ Servicio de email funcionando correctamente. ID: ${result.messageId}`
        };
      } else {
        return {
          success: false,
          message: `❌ Error en el servicio: ${result.error}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Error al testear servicio: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }
}

// Instancia singleton
export const emailService = EmailService.getInstance();

// Hook de React para usar el servicio de email
export function useEmailService() {
  const sendAuthEmail = async (
    email: string, 
    type: 'login' | 'register' | 'reset'
  ): Promise<{ success: boolean; code?: string; messageId?: string; error?: string }> => {
    try {
      // Generar código de 6 dígitos
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Enviar email
      const result = await emailService.sendEmail(email, type, code);
      
      if (result.success) {
        return {
          success: true,
          code, // En producción, no retornar el código
          messageId: result.messageId
        };
      } else {
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al enviar email'
      };
    }
  };

  const testService = async () => {
    return await emailService.testEmailService();
  };

  const setApiKey = (apiKey: string) => {
    emailService.setApiKey(apiKey);
  };

  const getMaskedApiKey = () => {
    return emailService.getMaskedApiKey();
  };

  const clearApiKey = () => {
    emailService.clearApiKey();
  };

  const isConfigured = () => {
    const masked = emailService.getMaskedApiKey();
    return masked !== 'No configurada';
  };

  return {
    sendAuthEmail,
    testService,
    setApiKey,
    getMaskedApiKey,
    clearApiKey,
    isConfigured
  };
}
