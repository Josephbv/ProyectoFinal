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
        // Lanzamos un error que el toast pueda mostrar para diagnosticar
        throw new Error(`Error de formato JSON: ${text.substring(0, 40)}...`);
    }
}

/**
 * Wrapper de fetch que usa safeJson internamente.
 * Lanza Error si resp.ok es false y hay un mensaje de error en el cuerpo.
 */
export async function apiFetch(url: string, options?: RequestInit): Promise<any> {
    const resp = await fetch(url, options);
    const data = await safeJson(resp);
    if (!resp.ok) {
        const msg = data?.error || data?.message || `Error HTTP ${resp.status}`;
        throw new Error(msg);
    }
    return data;
}
