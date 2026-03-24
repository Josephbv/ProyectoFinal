/**
 * Convierte cualquier representación de hora a formato 12h con AM/PM.
 * Acepta: "14:30", "14:30:00", ISO datetime string, o un objeto Date.
 */
export function formatTo12h(hora: string | Date | null | undefined): string {
    if (!hora) return '';

    let hours = 0;
    let minutes = 0;

    if (hora instanceof Date) {
        hours = hora.getUTCHours();
        minutes = hora.getUTCMinutes();
    } else if (typeof hora === 'string') {
        // Si es string tipo "HH:mm" o "HH:mm:ss"
        if (/^\d{1,2}:\d{2}/.test(hora)) {
            const parts = hora.split(':');
            hours = parseInt(parts[0], 10);
            minutes = parseInt(parts[1], 10);
        } else {
            // Intentar parsear como fecha ISO
            const d = new Date(hora);
            if (!isNaN(d.getTime())) {
                hours = d.getUTCHours();
                minutes = d.getUTCMinutes();
            } else {
                return hora; // Devolver tal cual si no se puede parsear
            }
        }
    }

    const period = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 === 0 ? 12 : hours % 12;
    const mm = minutes.toString().padStart(2, '0');
    return `${h12}:${mm} ${period}`;
}
