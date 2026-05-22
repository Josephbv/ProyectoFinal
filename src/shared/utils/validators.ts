export const VALIDATORS = {
    nombre: {
        regex: /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'-]+$/,
        message: "Solo se permiten letras y espacios. Por favor, retira números o símbolos especiales."
    },
    email: {
        regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: "El formato de correo no es válido. Asegúrate de incluir el '@' y un dominio (ej: usuario@correo.com)."
    },
    telefono: {
        regex: /^\d{10}$/,
        message: "Debe tener exactamente 10 dígitos numéricos (ej: 3001234567). Sin espacios ni guiones."
    },
    cedula: {
        regex: /^\d{6,15}$/,
        message: "El documento debe tener entre 6 y 15 dígitos numéricos."
    },
    precio: {
        check: (val: number) => val > 0,
        message: "El valor debe ser un número positivo mayor a 0."
    }
};

export const soloLetras = (valor: string) => VALIDATORS.nombre.regex.test(valor.trim());
export const esEmailValido = (valor: string) => VALIDATORS.email.regex.test(valor.trim());
export const esTelefonoValido = (valor: string) => VALIDATORS.telefono.regex.test(valor.trim());
export const esCedulaValida = (valor: string) => VALIDATORS.cedula.regex.test(valor.trim());
