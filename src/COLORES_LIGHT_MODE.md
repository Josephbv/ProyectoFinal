# 🎨 Paleta de Colores - Modo Claro (Light Mode)

## Actualización del Sistema de Colores

KaiVet Manager v1.0.0 ahora incluye una **paleta de colores pasteles moderna** para modo claro, inspirada en tonos **Lavanda-Indigo-Cyan** que proporciona una experiencia visual suave, profesional y que no cansa la vista.

---

## 🌈 Paleta Principal - Modo Claro

### Colores Base
| Elemento | Color | Código | Descripción |
|----------|-------|--------|-------------|
| **Fondo Principal** | Lavanda Muy Suave | `#EEF2FF` (indigo-50) | Fondo general de páginas |
| **Tarjetas** | Blanco Puro | `#FFFFFF` | Fondo de cards y contenedores |
| **Texto Primario** | Indigo Oscuro | `#1E1B4B` (indigo-950) | Títulos y texto principal |
| **Texto Secundario** | Violeta Oscuro | `#4C1D95` (violet-900) | Subtítulos y texto secundario |
| **Bordes** | Lavanda Suave | `#C7D2FE` (indigo-200) | Bordes de elementos |

### Colores de Acción
| Acción | Color | Código | Uso |
|--------|-------|--------|-----|
| **CTA Principal** | Violeta-Azul | `#6366F1` (indigo-500) | Botones primarios, enlaces |
| **Acento** | Lavanda Medio | `#A5B4FC` (indigo-300) | Highlights, focus states |
| **Hover** | Lavanda Claro | `#E0E7FF` (indigo-100) | Estados hover |

---

## ✅ Colores Funcionales

### Estados de Éxito/Error
| Estado | Color | Código | Uso |
|--------|-------|--------|-----|
| **Positivo** | Verde Menta | `#4ADE80` (green-400) | Éxito, activo, completado |
| **Negativo** | Rosa Coral | `#FB7185` (rose-400) | Error, inactivo, cancelado |
| **Advertencia** | Amarillo Dorado | `#FBBF24` (amber-400) | Alertas, pendiente |
| **Info** | Cyan Brillante | `#22D3EE` (cyan-400) | Información, en proceso |

### Colores de Gráficos
Los gráficos utilizan una paleta coordinada de 8 colores pasteles vibrantes:
1. `#6366F1` - Indigo (Principal)
2. `#4ADE80` - Verde Menta
3. `#A5B4FC` - Lavanda Claro
4. `#FBBF24` - Amarillo Dorado
5. `#FB7185` - Rosa Coral
6. `#C084FC` - Púrpura Pastel
7. `#22D3EE` - Cyan Brillante
8. `#A3E635` - Lima Vibrante

---

## 🎯 Botones de Acción en Tablas

Los iconos de acciones en las tablas mantienen colores distintivos y visibles:

| Acción | Color | Hover |
|--------|-------|-------|
| **Ver/Consulta** 👁️ | Azul `#3B82F6` | Fondo azul 10% opacidad |
| **Editar** ✏️ | Amarillo `#F59E0B` | Fondo amarillo 10% opacidad |
| **Eliminar** 🗑️ | Rojo `#EF4444` | Fondo rojo 10% opacidad |
| **Agregar** ➕ | Verde `#10B981` | Fondo verde 10% opacidad |

---

## 🪟 Glass Morphism - Modo Claro

El efecto glass morphism se adapta al modo claro con:
- **Fondo**: `rgba(255, 255, 255, 0.95)` - Blanco casi opaco
- **Bordes**: `rgba(99, 102, 241, 0.15)` - Tinte indigo suave
- **Sombras**: `0 8px 32px rgba(99, 102, 241, 0.12)` - Sombra lavanda sutil
- **Blur**: `backdrop-blur(20px)` - Efecto de desenfoque

---

## 📊 Tablas

Las tablas en modo claro tienen:
- **Encabezados**: Fondo lavanda claro `#E0E7FF`
- **Filas pares**: Blanco puro
- **Filas impares**: Casi blanco con tinte lavanda `#FAFBFF`
- **Hover**: Lavanda muy suave `rgba(224, 231, 255, 0.3)`
- **Bordes**: Lavanda suave `rgba(199, 210, 254, 0.3)`

---

## 📝 Formularios

Los campos de formulario utilizan:
- **Fondo**: Blanco puro
- **Borde**: Lavanda suave `rgba(199, 210, 254, 0.5)`
- **Focus**: Indigo `#6366F1` con ring lavanda
- **Placeholder**: Indigo oscuro 45% opacidad

---

## 🎨 Badges de Estado

### Variantes de Badge
| Estado | Fondo | Texto |
|--------|-------|-------|
| **Activo** | Verde 15% opacidad | Verde `#10B981` |
| **Inactivo** | Rojo 15% opacidad | Rojo `#EF4444` |
| **Pendiente** | Amarillo 15% opacidad | Amarillo `#F59E0B` |
| **Completado** | Azul 15% opacidad | Azul `#3B82F6` |
| **Cancelado** | Gris 15% opacidad | Gris `#6B7280` |

---

## 🔄 Gradientes

### Botones Primarios
```css
background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
```

### Botones Secundarios
```css
background: linear-gradient(135deg, #22D3EE 0%, #6366F1 100%);
```

### Acentos
```css
background: linear-gradient(135deg, #4ADE80 0%, #10B981 100%);
```

---

## 📱 Navegación (Sidebar)

En modo claro, el sidebar utiliza:
- **Fondo**: Blanco puro `#FFFFFF`
- **Texto**: Indigo oscuro `#1E1B4B`
- **Ítem Activo**: Gradiente lavanda con borde indigo
- **Hover**: Lavanda claro `rgba(224, 231, 255, 0.6)`
- **Bordes**: Lavanda suave `#DDD6FE`

---

## 🎯 Implementación

### Uso en Componentes

Todos los componentes del sistema utilizan clases de utilidad que automáticamente se adaptan al modo claro:

```tsx
// Estas clases funcionan en dark y light mode
<div className="bg-dark-bg">          // Fondo adaptativo
<h1 className="text-dark-primary">    // Texto primario adaptativo
<p className="text-dark-secondary">   // Texto secundario adaptativo
<div className="border-dark-color">   // Bordes adaptativos
<button className="dark-button-primary"> // Botón primario adaptativo
```

### Variables CSS Disponibles

```css
--dark-bg              /* Fondo principal */
--dark-card            /* Fondo de tarjetas */
--dark-primary-text    /* Texto principal */
--dark-secondary-text  /* Texto secundario */
--dark-positive        /* Color positivo */
--dark-negative        /* Color negativo */
--dark-cta             /* Call to action */
--dark-border          /* Bordes */
--dark-hover           /* Estados hover */
```

---

## 🌟 Consistencia Visual

La nueva paleta garantiza:
- ✅ **Contraste adecuado** para accesibilidad
- ✅ **Colores consistentes** en todos los módulos
- ✅ **Tonos pasteles** que no cansan la vista
- ✅ **Jerarquía visual** clara
- ✅ **Profesionalismo** moderno
- ✅ **Identidad de marca** cohesiva

---

## 🔧 Configuración del Tema

El modo claro está configurado como **predeterminado** del sistema. Los usuarios pueden alternar entre dark y light mode usando el botón en el header del Dashboard.

El tema se guarda en `localStorage` bajo la clave `kaivet_theme`.

---

**Última actualización**: 2025-01-13  
**Sistema**: KaiVet Manager v1.0.0  
**Tema**: Light Mode - Paleta Lavanda-Indigo-Cyan
