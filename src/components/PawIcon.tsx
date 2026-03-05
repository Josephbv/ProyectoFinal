export function PawIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 32 32" 
      fill="currentColor" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Almohadilla principal (pad central) - más grande y amplia */}
      <ellipse 
        cx="16" 
        cy="22" 
        rx="6" 
        ry="4.5" 
        fill="currentColor"
        opacity="0.95"
      />
      
      {/* Almohadilla secundaria para dar profundidad */}
      <ellipse 
        cx="16" 
        cy="21.5" 
        rx="4.5" 
        ry="3" 
        fill="currentColor"
        opacity="0.7"
      />
      
      {/* Dedo 1 - extremo izquierdo */}
      <ellipse 
        cx="8" 
        cy="12" 
        rx="2.8" 
        ry="3.5" 
        fill="currentColor"
        transform="rotate(-20 8 12)"
        opacity="0.9"
      />
      <ellipse 
        cx="8.2" 
        cy="11.5" 
        rx="1.8" 
        ry="2.2" 
        fill="currentColor"
        transform="rotate(-20 8.2 11.5)"
        opacity="0.6"
      />
      
      {/* Dedo 2 - centro izquierda */}
      <ellipse 
        cx="12.5" 
        cy="8" 
        rx="2.8" 
        ry="4" 
        fill="currentColor"
        transform="rotate(-8 12.5 8)"
        opacity="0.9"
      />
      <ellipse 
        cx="12.3" 
        cy="7.5" 
        rx="1.8" 
        ry="2.5" 
        fill="currentColor"
        transform="rotate(-8 12.3 7.5)"
        opacity="0.6"
      />
      
      {/* Dedo 3 - centro derecha */}
      <ellipse 
        cx="19.5" 
        cy="8" 
        rx="2.8" 
        ry="4" 
        fill="currentColor"
        transform="rotate(8 19.5 8)"
        opacity="0.9"
      />
      <ellipse 
        cx="19.7" 
        cy="7.5" 
        rx="1.8" 
        ry="2.5" 
        fill="currentColor"
        transform="rotate(8 19.7 7.5)"
        opacity="0.6"
      />
      
      {/* Dedo 4 - extremo derecho */}
      <ellipse 
        cx="24" 
        cy="12" 
        rx="2.8" 
        ry="3.5" 
        fill="currentColor"
        transform="rotate(20 24 12)"
        opacity="0.9"
      />
      <ellipse 
        cx="23.8" 
        cy="11.5" 
        rx="1.8" 
        ry="2.2" 
        fill="currentColor"
        transform="rotate(20 23.8 11.5)"
        opacity="0.6"
      />
      
      {/* Detalles adicionales para textura */}
      <ellipse 
        cx="16" 
        cy="20" 
        rx="2" 
        ry="1" 
        fill="currentColor"
        opacity="0.3"
      />
      
      {/* Pequeños detalles en cada dedo */}
      <circle cx="8" cy="10.5" r="0.8" fill="currentColor" opacity="0.4" />
      <circle cx="12.5" cy="6.5" r="0.8" fill="currentColor" opacity="0.4" />
      <circle cx="19.5" cy="6.5" r="0.8" fill="currentColor" opacity="0.4" />
      <circle cx="24" cy="10.5" r="0.8" fill="currentColor" opacity="0.4" />
    </svg>
  );
}
