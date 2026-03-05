# KaiVet Manager 2.0

## 🎯 Identidad de Marca Renovada
- **Nombre del sistema**: KaiVet Manager
- **Versión**: v1.0.0
- **Descripción**: Gestión Veterinaria Integral de Nueva Generación
- **Tema principal**: Dual Mode - Dark Mode con Glass Morphism + Light Mode Pasteles Lavanda-Indigo
- **Tema predeterminado**: Light Mode (Colores Pasteles)
- **Tipografía**: Inter, SF Pro Display (sistema Apple), BlinkMacSystemFont
- **Logo**: Huella de perro estilizada con gradientes modernos
- **Documentación de colores**: Ver `COLORES_LIGHT_MODE.md` para paleta completa

## 🎨 Paleta de Colores Moderna

### Colores Dark Mode (Predeterminado)
- **Fondo principal**: `#020617` (slate-950)
- **Fondo tarjetas**: `#0f172a` (slate-900) 
- **Texto primario**: `#f8fafc` (slate-50)
- **Texto secundario**: `#94a3b8` (slate-400)
- **Color CTA**: `#3b82f6` (blue-500)

### Colores Light Mode (Pasteles Lavanda-Indigo)
- **Fondo principal**: `#EEF2FF` (indigo-50) - Lavanda muy suave
- **Fondo tarjetas**: `#FFFFFF` (white) - Blanco puro
- **Texto primario**: `#1E1B4B` (indigo-950) - Indigo oscuro
- **Texto secundario**: `#4C1D95` (violet-900) - Violeta oscuro
- **Color CTA**: `#6366F1` (indigo-500) - Violeta-azul vibrante
- **Acentos**: `#A5B4FC` (indigo-300) - Lavanda medio
- **Bordes**: `#C7D2FE` (indigo-200) - Lavanda suave

### Colores Funcionales (Ambos Modos)
- **Positivo/Éxito**: 
  - Dark: `#10b981` (emerald-500)
  - Light: `#4ADE80` (green-400) - Verde menta
- **Negativo/Error**: 
  - Dark: `#ef4444` (red-500)
  - Light: `#FB7185` (rose-400) - Rosa coral
- **Advertencia**: `#f59e0b` / `#FBBF24` (amber-400/500)
- **Info**: `#06b6d4` / `#22D3EE` (cyan-400/500)
- **Acento**: `#8b5cf6` / `#C084FC` (purple-400/500)

### Efectos Glass Morphism
**Dark Mode:**
- **Fondo glass**: `rgba(15, 23, 42, 0.8)` con `backdrop-blur(20px)`
- **Bordes glass**: `rgba(148, 163, 184, 0.1)`
- **Sombras**: `0 8px 32px rgba(0, 0, 0, 0.2)`

**Light Mode:**
- **Fondo glass**: `rgba(255, 255, 255, 0.95)` con `backdrop-blur(20px)`
- **Bordes glass**: `rgba(99, 102, 241, 0.15)` - Tinte indigo suave
- **Sombras**: `0 8px 32px rgba(99, 102, 241, 0.12)` - Sombra lavanda

## 🏗️ Arquitectura del Sistema

### Módulos Principales (4)
1. **Dashboard** - Vista general y métricas `⌘D`
2. **Ventas** - Gestión de ventas y comprobantes `⌘V`
3. **Clientes** - Administración de clientes `⌘C`
4. **Agendamiento** - Programación de citas `⌘A`

### Módulos de Mascotas (2)
5. **Mascotas** - Registro completo (solo perros) `⌘M`
6. **Historial Mascotas** - Historial médico y consultas `⌘H`

### Módulos de Operaciones (2)
7. **Horario** - Gestión de horarios del personal `⌘O`
8. **Servicios** - Catálogo de servicios veterinarios `⌘S`

### Módulos de Sistema (2)
9. **Usuario** - Gestión del personal `⌘U`
10. **Roles** - Administración de roles y permisos `⌘R`

**Nota:** El módulo Dashboard ahora incluye analytics avanzado y business intelligence integrado (fusión Dashboard + Medición).

## 🎨 Sistema de Diseño

### Principios de Diseño
- **Developer-Friendly**: Interfaz optimizada para programadores
- **Glass Morphism**: Efectos modernos de cristal y transparencias
- **Micro-interacciones**: Animaciones sutiles y feedback visual
- **Shortcuts de teclado**: Accesos rápidos estilo IDE
- **Status en tiempo real**: Indicadores de estado sistema/usuario

### Componentes Principales

#### Botones
```css
/* Botón Primario - Dark Mode */
.dark-button-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
  transform: translateY(-1px) on hover;
}

/* Botón Primario - Light Mode */
.light .dark-button-primary {
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
  color: #ffffff;
}

/* Botón Secundario - Dark Mode */
.dark-button-secondary {
  background: transparent;
  border: 1px solid rgba(59, 130, 246, 0.3);
  backdrop-filter: blur(10px);
}

/* Botón Secundario - Light Mode */
.light .dark-button-secondary {
  background: rgba(224, 231, 255, 0.5);
  border: 1px solid rgba(99, 102, 241, 0.3);
  color: #6366F1;
}
```

#### Tarjetas
```css
/* Dark Mode */
.dark-card {
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

/* Light Mode */
.light .dark-card {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(199, 210, 254, 0.5);
  box-shadow: 0 4px 24px rgba(99, 102, 241, 0.08);
}
```

#### Navegación
- **Sidebar colapsible**: Toggle con animación fluida
- **Búsqueda rápida**: Command palette `⌘K`
- **Breadcrumbs**: Navegación contextual
- **Status indicators**: Estado del sistema y usuario

## 🚀 Características Modernas

### UX Mejorado
- **Sidebar colapsible** con estado persistente
- **Command palette** para búsqueda rápida de módulos
- **Keyboard shortcuts** estilo VSCode/IDE
- **Status indicators** en tiempo real
- **Micro-animaciones** suaves y modernas

### UI Refinado
- **Glass morphism** con transparencias y blur
- **Gradientes modernos** en elementos clave
- **Tipografía optimizada** con Inter y SF Pro
- **Scrollbars personalizados** minimalistas
- **Feedback visual mejorado** en interacciones

### Developer Experience
- **Shortcuts de teclado** para navegación rápida
- **Estado del sistema** visible permanentemente
- **Breadcrumbs** para orientación contextual
- **Loading states** y feedback inmediato
- **Responsive design** optimizado

## 🔧 Especificaciones Técnicas

### Roles del Sistema
- **Administrador**: Acceso completo a todos los módulos
- **Cliente**: Acceso limitado a información personal y mascotas
- **Asistente**: Acceso a operaciones cotidianas

### Animaciones y Transiciones
- **Duración estándar**: `0.2s cubic-bezier(0.4, 0, 0.2, 1)`
- **Hover effects**: `transform: translateY(-1px)` y sombras
- **Loading states**: Spinners y skeleton screens
- **Page transitions**: Fade in/slide up suaves

### Responsive Breakpoints
- **Desktop**: 1024px+
- **Tablet**: 768px - 1023px  
- **Mobile**: < 768px
- **Sidebar**: Se colapsa automáticamente en móvil

## 📱 Adaptabilidad

### Desktop First
- Diseño optimizado para pantallas grandes
- Sidebar completo con todas las características
- Shortcuts de teclado completamente funcionales

### Mobile Responsive  
- Sidebar se convierte en drawer/overlay
- Navegación touch-friendly
- Contenido adaptativo sin pérdida de funcionalidad

### Accesibilidad
- Contraste mejorado para texto
- Focus indicators visibles
- Soporte para lectores de pantalla
- Navegación por teclado completa

---

## 💡 Filosofía de Diseño

**"Potencia profesional con experiencia moderna"**

KaiVet Manager 2.0 combina la robustez de un sistema empresarial con la elegancia y usabilidad de las aplicaciones modernas. Diseñado pensando en veterinarios profesionales que valoran tanto la eficiencia como la estética.

### Valores Clave:
- ⚡ **Performance**: Rápido y responsivo
- 🎯 **Precision**: Información clara y organizada  
- 🔮 **Innovation**: Tecnología de vanguardia
- 💎 **Quality**: Atención al detalle en cada elemento
- 🤝 **Usability**: Interfaz intuitiva y accesible