# 📧 Configuración del Sistema de Email - KaiVet Manager

Este documento explica cómo configurar el sistema de envío de emails reales en KaiVet Manager usando **Resend**.

## 🎯 Estado Actual

### ✅ **Implementado**
- ✨ Servicio completo de email con Resend
- 📧 Templates HTML profesionales y responsive
- 🔐 Códigos de verificación con expiración
- 🚀 Modo desarrollo con simulación
- 📊 Sistema de pruebas integrado
- 🎨 Diseño moderno con Glass Morphism

### 📋 **Tipos de Email Configurados**
- **Login**: Código de verificación para iniciar sesión
- **Registro**: Email de bienvenida con código de verificación  
- **Recuperación**: Código para restablecer contraseña

---

## 🛠️ Configuración Paso a Paso

### 1. **Crear Cuenta en Resend**

1. Ve a [https://resend.com](https://resend.com)
2. Crea una cuenta gratuita
3. Verifica tu email

### 2. **Obtener API Key**

1. Ve a "API Keys" en tu dashboard de Resend
2. Clic en "Create API Key"
3. Dale un nombre: "KaiVet Manager"
4. Selecciona permisos: "Sending access"
5. **Copia la API key** (formato: `re_xxxxxxxxx_...`)

### 3. **Configurar en KaiVet Manager**

1. Abre KaiVet Manager
2. Ve a **Dashboard → Email Config**
3. Pega tu API key en el campo correspondiente
4. Haz clic en **"Guardar"**
5. Prueba el servicio con **"Probar Email"**

### 4. **¡Listo para usar!**

Una vez configurada la API key:
- Los emails se enviarán realmente
- Recibirás códigos de verificación en tu bandeja
- El sistema cambiará automáticamente a modo producción

### 5. **Configurar Dominio (Opcional)**

#### Para usar tu propio dominio:
```bash
# Si tienes el dominio kaivetmanager.com
1. Ve a "Domains" en tu dashboard de Resend
2. Agrega el dominio: kaivetmanager.com  
3. Configura los registros DNS según las instrucciones
4. Espera la verificación (puede tomar hasta 24 horas)
```

#### Sin dominio personalizado:
- Resend permite enviar emails sin dominio verificado
- Los emails se envían desde resend.dev
- Funciona perfectamente para desarrollo y pruebas

---

## 📧 Configuración Actual

### **Correos del Sistema**

| Email | Contraseña | Rol | Estado |
|-------|------------|-----|--------|
| `admin@kaivet.com` | `1234` | Administrador | ✅ Activo |
| `kaivetmanager@gmail.com` | `kaivet2024` | Manager Principal | ✅ Activo |

### **Templates de Email**

#### 🔐 **Login/Verificación**
- **Asunto**: "🔐 Código de verificación - KaiVet Manager"
- **Contenido**: Código de 6 dígitos
- **Expiración**: 10 minutos
- **Diseño**: Moderno con gradientes azules

#### 🔑 **Recuperación de Contraseña**  
- **Asunto**: "🔑 Recuperación de contraseña - KaiVet Manager"
- **Contenido**: Código de recuperación + instrucciones
- **Expiración**: 15 minutos
- **Diseño**: Enfoque en seguridad con colores ámbar

#### 🎉 **Bienvenida/Registro**
- **Asunto**: "🎉 ¡Bienvenido a KaiVet Manager!"
- **Contenido**: Código de verificación + lista de características
- **Expiración**: 10 minutos  
- **Diseño**: Colores verdes con información del producto

---

## 🔧 Archivos Modificados

### **Nuevos Archivos**
```
/components/services/emailService.tsx  # Servicio principal de email
/components/EmailConfig.tsx           # Componente de configuración
/.env.example                         # Variables de entorno de ejemplo
/EMAIL_SETUP.md                      # Esta documentación
```

### **Archivos Actualizados**
```
/components/hooks/useEmailAuth.tsx    # Integración con servicio real
/components/pages/LoginPage.tsx       # Funcionalidad de prueba
```

---

## 🧪 Modo Desarrollo vs Producción

### **Desarrollo** (Predeterminado)
```javascript
// El sistema detecta automáticamente modo desarrollo cuando:
- No hay API key configurada
- API key contiene "placeholder" o "123456"  
- Hostname es "localhost"

// Comportamiento:
✅ Simula envío de emails
📝 Muestra códigos en consola
⚡ No requiere configuración externa
🎯 Perfecto para desarrollo y pruebas
```

### **Producción**
```javascript
// Se activa automáticamente cuando:
- API key real de Resend está configurada
- Dominio está verificado
- Variables de entorno están completas

// Comportamiento:  
📧 Envía emails reales
🔐 Códigos seguros (no se muestran en logs)
📊 Tracking de entrega
✅ Listo para usuarios finales
```

---

## 🎨 Personalización de Templates

Los templates están diseñados con el sistema de design de KaiVet Manager:

### **Colores**
```css
--primary: #3b82f6 (blue-500)
--secondary: #8b5cf6 (violet-500)  
--success: #10b981 (emerald-500)
--warning: #f59e0b (amber-500)
--background: #020617 (slate-950)
--card: #0f172a (slate-900)
```

### **Tipografía**
```css
font-family: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif
```

### **Efectos**
- Glass morphism
- Gradientes modernos
- Bordes redondeados
- Sombras sutiles

---

## 🔒 Seguridad

### **Códigos de Verificación**
- ✅ 6 dígitos aleatorios
- ⏰ Expiración automática
- 🔒 Un solo uso
- 🚫 No se almacenan en logs de producción

### **Headers de Seguridad**
```javascript
'X-Entity-Ref-ID': 'kaivet-{type}-{timestamp}'
```

### **Tags de Seguimiento**
```javascript
tags: [
  { name: 'category', value: 'authentication' },
  { name: 'type', value: 'login|register|reset' },
  { name: 'system', value: 'kaivet-manager' }
]
```

---

## 📊 Monitoreo y Analytics

### **Dashboard de Resend**
- 📈 Estadísticas de entrega
- 📧 Historial de emails
- ❌ Reportes de errores
- 📊 Analytics detallados

### **Logs del Sistema**
```javascript
// Desarrollo
console.log('📧 Email enviado a:', email);
console.log('🔐 Código:', code);
console.log('📋 Tipo:', type);

// Producción  
console.log('✅ Email enviado exitosamente:', messageId);
// Los códigos NO se muestran en producción
```

---

## 🚨 Solución de Problemas

### **Error: "API key inválida"**
```bash
# Verifica que tu API key sea correcta
# Formato esperado: re_xxxxxxxxx_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### **Error: "Dominio no verificado"**
```bash
# Opciones:
1. Usa el subdominio temporal de Resend
2. Configura correctamente los registros DNS
3. Espera hasta 24 horas para la verificación
```

### **Email no llega**
```bash
# Checklist:
1. ✅ Verifica spam/promociones
2. ✅ Confirma que el email esté bien escrito
3. ✅ Revisa el dashboard de Resend para errores
4. ✅ Prueba con otro email
```

### **Modo desarrollo activado por error**
```bash
# Causas comunes:
- API key mal configurada
- Variables de entorno no cargadas
- Archivo .env en ubicación incorrecta
```

---

## 🎯 Próximos Pasos

### **Mejoras Planificadas**
- [ ] Notificaciones push
- [ ] Templates personalizables desde admin
- [ ] Integración con WhatsApp Business
- [ ] Sistema de newsletters
- [ ] Analytics avanzados

### **Integraciones Futuras**
- [ ] SendGrid (alternativa)
- [ ] Mailgun (alternativa)
- [ ] Amazon SES (escalabilidad)

---

## 📞 Soporte

### **Contacto**
- **Email**: kaivetmanager@gmail.com
- **Sistema**: Configuración → Email → Probar Servicio

### **Documentación Adicional**
- [Resend Documentation](https://resend.com/docs)
- [KaiVet Manager Guidelines](./guidelines/Guidelines.md)

---

**¡Tu sistema de email está listo para funcionar! 🚀**

*KaiVet Manager 2.0 - Gestión Veterinaria de Nueva Generación*