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
        regex: /^3\d{9}$/,
        message: "El teléfono debe empezar con 3 y tener exactamente 10 dígitos numéricos (ej: 3001234567). Sin espacios ni guiones."
    },
    cedula: {
        regex: /^\d{6,15}$/,
        message: "El documento debe tener entre 6 y 15 dígitos numéricos sin tener más de 3 números repetidos continuamente."
    },
    precio: {
        check: (val: number) => val > 0,
        message: "El valor debe ser un número positivo mayor a 0."
    }
};

export const soloLetras = (valor: string) => VALIDATORS.nombre.regex.test(valor.trim());
export const esEmailValido = (valor: string) => VALIDATORS.email.regex.test(valor.trim());
export const esTelefonoValido = (valor: string) => VALIDATORS.telefono.regex.test(valor.trim());
export const esCedulaValida = (valor: string) => {
    const v = valor.trim();
    // Debe tener longitud correcta y no contener 4 o más dígitos idénticos consecutivos (ej: no "1111")
    return VALIDATORS.cedula.regex.test(v) && !/(\d)\1{3}/.test(v);
};
