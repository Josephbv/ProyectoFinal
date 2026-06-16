/**
 * Hace un fetch seguro. Si la respuesta está vacía (204) o mal formada,
 * devuelve null en lugar de lanzar "Unexpected end of JSON input".
 */
export async function safeJson(resp: Response): Promise<any> {
    const text = await resp.text();
    if (!text || text.trim() === '') return null;
    try {
        return JSON.parse(text);
    } catch (e: any) {
        // Si no es JSON, devolvemos el texto original para que pueda ser mostrado
        // especialmente si es un error del servidor (400, 500)
        return text;
    }
}

/**
 * Wrapper de fetch con reintentos automáticos para errores 5xx (cold-start del servidor).
 * - GET: hasta 3 intentos con backoff
 * - POST/PUT/PATCH/DELETE: 1 reintento (para no duplicar operaciones)
 * - 4xx: nunca se reintenta (error permanente del cliente)
 */
export async function apiFetch(url: string, options?: RequestInit): Promise<any> {
    const method = (options?.method || 'GET').toUpperCase();
    const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    const maxRetries = isMutating ? 2 : 3;
    const baseDelay = 800; // ms

    let lastError: Error = new Error('Error desconocido');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 35000); // 35 segundos máximo (waking up Somee can take up to 25s)

        try {
            const resp = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timeoutId);
            const data = await safeJson(resp);

            // Errores 4xx: no reintentar, son errores del cliente
            if (resp.status >= 400 && resp.status < 500) {
                const msg = typeof data === 'string' ? data : (data?.error || data?.message || `Error HTTP ${resp.status}`);
                throw new Error(msg);
            }

            // Errores 5xx: reintentar si hay intentos restantes
            if (!resp.ok) {
                const msg = typeof data === 'string' ? data : (data?.error || data?.message || `Error HTTP ${resp.status}`);
                lastError = new Error(msg);
                if (attempt < maxRetries) {
                    const delay = baseDelay * attempt;
                    console.warn(`[apiFetch] Intento ${attempt}/${maxRetries} fallido (${resp.status}). Reintentando en ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                throw lastError;
            }

            return data;
        } catch (err: any) {
            clearTimeout(timeoutId);
            const isTimeout = err.name === 'AbortError';

            // Error de red o Timeout
            if (isTimeout || err.name === 'TypeError' || err.message?.includes('fetch')) {
                lastError = new Error(isTimeout ? 'El servidor tardó demasiado en responder.' : 'Sin conexión con el servidor.');
                if (attempt < maxRetries) {
                    const delay = baseDelay * attempt;
                    console.warn(`[apiFetch] ${isTimeout ? 'Timeout' : 'Red'} intento ${attempt}/${maxRetries}. Reintentando en ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
            }
            throw err;
        }
    }

    throw lastError;
}
