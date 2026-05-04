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
        console.error('[safeJson] Error de parseo:', text.substring(0, 100));
        throw new Error(`Error de formato JSON: ${text.substring(0, 40)}...`);
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
        try {
            const resp = await fetch(url, options);
            const data = await safeJson(resp);

            // Errores 4xx: no reintentar, son errores del cliente
            if (resp.status >= 400 && resp.status < 500) {
                const msg = data?.error || data?.message || `Error HTTP ${resp.status}`;
                throw new Error(msg);
            }

            // Errores 5xx: reintentar si hay intentos restantes
            if (!resp.ok) {
                const msg = data?.error || data?.message || `Error HTTP ${resp.status}`;
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
            // Error de red (sin conexión, timeout, etc.)
            if (err.name === 'TypeError' || err.message?.includes('fetch')) {
                lastError = new Error('Sin conexión con el servidor. Verifica tu internet.');
                if (attempt < maxRetries) {
                    const delay = baseDelay * attempt;
                    console.warn(`[apiFetch] Error de red intento ${attempt}/${maxRetries}. Reintentando en ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
            }
            // Cualquier otro error (4xx, JSON parse, etc.): lanzar inmediatamente
            throw err;
        }
    }

    throw lastError;
}
