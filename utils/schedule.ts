export type Turno = { open: string; close: string };
export type TurnoExtra = Turno & { enabled: boolean };
export type DayScheduleObj = {
    is_closed: boolean;
    turno1: Turno;
    turno2: TurnoExtra;
};
export type WeekScheduleType = Record<string, DayScheduleObj>;

const DAYS_KEY_INFO = [
    { key: 'dom', index: 0, label: 'Domingos' },
    { key: 'lun', index: 1, label: 'Lunes' },
    { key: 'mar', index: 2, label: 'Martes' },
    { key: 'mie', index: 3, label: 'Miércoles' },
    { key: 'jue', index: 4, label: 'Jueves' },
    { key: 'vie', index: 5, label: 'Viernes' },
    { key: 'sab', index: 6, label: 'Sábados' },
];

/**
 * Normaliza cualquier formato heredado de schedule al nuevo formato.
 * Formato heredado: { enabled: boolean, open: string, close: string }
 * Nuevo formato: { is_closed: boolean, turno1: { open, close }, turno2: { enabled, open, close } }
 */
export function normalizeSchedule(schedule: any): WeekScheduleType | null {
    if (!schedule || typeof schedule !== 'object') return null;
    
    const normalized: Record<string, any> = {};
    for (const d of DAYS_KEY_INFO) {
        const dayData = schedule[d.key];
        if (!dayData) {
            normalized[d.key] = {
                is_closed: true,
                turno1: { open: '09:00', close: '20:00' },
                turno2: { enabled: false, open: '18:00', close: '23:00' },
            };
            continue;
        }

        // Si ya tiene el nuevo formato (tiene turno1)
        if (dayData.turno1) {
            normalized[d.key] = dayData;
            continue;
        }

        // Si tiene el formato viejo (tiene enabled)
        if ('enabled' in dayData) {
            normalized[d.key] = {
                is_closed: !dayData.enabled,
                turno1: { open: dayData.open || '09:00', close: dayData.close || '20:00' },
                turno2: { enabled: false, open: '18:00', close: '23:00' },
            };
            continue;
        }

        // Si tiene formato muy viejo de DB { is_closed, open, close }
        if ('is_closed' in dayData && !dayData.turno1) {
            normalized[d.key] = {
                is_closed: dayData.is_closed,
                turno1: { open: dayData.open || '09:00', close: dayData.close || '20:00' },
                turno2: { enabled: false, open: '18:00', close: '23:00' },
            };
            continue;
        }

        // Fallback default
        normalized[d.key] = {
            is_closed: true,
            turno1: { open: '09:00', close: '20:00' },
            turno2: { enabled: false, open: '18:00', close: '23:00' },
        };
    }
    return normalized as WeekScheduleType;
}

const timeToMinutes = (timeStr: string): number => {
    if (!timeStr || !timeStr.includes(':')) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
};

const checkTurnoMatch = (turno: { open: string; close: string }, currentMins: number, crossDayCheck: 'none' | 'previous_day' | 'current_day'): boolean => {
    if (!turno || !turno.open || !turno.close) return false;
    
    const openMins = timeToMinutes(turno.open);
    const closeMins = timeToMinutes(turno.close);
    const crossesMidnight = openMins > closeMins;

    if (crossDayCheck === 'previous_day') {
        // Mirando el turno de ayer, si cruza la medianoche y estamos en la madrugada de hoy (ej. de 00:00 a closeMins)
        return crossesMidnight && currentMins <= closeMins;
    }

    if (crossDayCheck === 'current_day') {
         // Mirando el turno de hoy, si cruza la medianoche y estamos en la noche de hoy (ej. de openMins a 23:59)
         return crossesMidnight && currentMins >= openMins;
    }

    // Comprobación normal ('none') o para turnos que no cruzan y miramos el día actual
    if (!crossesMidnight) {
        return currentMins >= openMins && currentMins <= closeMins;
    }

    return false; // Nunca debería llegar aquí bajo uso esperado
};

/**
 * Verifica si un negocio está abierto en este momento, basado exclusivamente en el horario.
 * @param rawSchedule El objeto de horario proveniente del store o Supabase
 */
export function checkIsBusinessOpen(rawSchedule: any): boolean {
    const schedule = normalizeSchedule(rawSchedule);
    if (!schedule) return true; // Si no hay horario establecido asumimos abierto si is_open manual lo permitió

    const now = new Date();
    const todayIndex = now.getDay();
    const prevDayIndex = todayIndex === 0 ? 6 : todayIndex - 1;
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const todayKey = DAYS_KEY_INFO.find(d => d.index === todayIndex)?.key!;
    const prevDayKey = DAYS_KEY_INFO.find(d => d.index === prevDayIndex)?.key!;

    const todaySched = schedule[todayKey];
    const prevSched = schedule[prevDayKey];

    // Chequear si por el turno del DÍA ANTERIOR seguimos abiertos hoy tras la medianoche
    if (prevSched && !prevSched.is_closed) {
        if (checkTurnoMatch(prevSched.turno1, currentMins, 'previous_day')) return true;
        if (prevSched.turno2.enabled && checkTurnoMatch(prevSched.turno2, currentMins, 'previous_day')) return true;
    }

    // Chequear los turnos del DÍA ACTUAL
    if (todaySched && !todaySched.is_closed) {
        // Turno 1
        const t1MinsOpen = timeToMinutes(todaySched.turno1.open);
        const t1MinsClose = timeToMinutes(todaySched.turno1.close);
        if (t1MinsOpen > t1MinsClose) {
            if (checkTurnoMatch(todaySched.turno1, currentMins, 'current_day')) return true;
        } else {
            if (checkTurnoMatch(todaySched.turno1, currentMins, 'none')) return true;
        }

        // Turno 2
        if (todaySched.turno2.enabled) {
            const t2MinsOpen = timeToMinutes(todaySched.turno2.open);
            const t2MinsClose = timeToMinutes(todaySched.turno2.close);
            if (t2MinsOpen > t2MinsClose) {
                if (checkTurnoMatch(todaySched.turno2, currentMins, 'current_day')) return true;
            } else {
                if (checkTurnoMatch(todaySched.turno2, currentMins, 'none')) return true;
            }
        }
    }

    return false;
}

/**
 * Agrupa los días seguidos que comparten exactamente la misma configuración.
 */
export function getFormattedScheduleList(rawSchedule: any): { label: string; text: string }[] {
    const schedule = normalizeSchedule(rawSchedule);
    if (!schedule) return [];

    const formatDayTime = (daySched: DayScheduleObj) => {
        if (daySched.is_closed) return 'Cerrado';
        let str = `${daySched.turno1.open} - ${daySched.turno1.close}`;
        if (daySched.turno2.enabled) {
            str += ` y ${daySched.turno2.open} - ${daySched.turno2.close}`;
        }
        return str;
    };

    // Ordenar de Lunes a Domingo
    const orderedKeys = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];
    const groups: { startIdx: number; endIdx: number; timeStr: string }[] = [];

    let currentGroupStr: string | null = null;
    let groupStart = 0;

    for (let i = 0; i < orderedKeys.length; i++) {
        const key = orderedKeys[i];
        const daySched = schedule[key];
        const dayStr = formatDayTime(daySched);

        if (currentGroupStr === null) {
            currentGroupStr = dayStr;
            groupStart = i;
        } else if (currentGroupStr !== dayStr) {
            groups.push({ startIdx: groupStart, endIdx: i - 1, timeStr: currentGroupStr });
            currentGroupStr = dayStr;
            groupStart = i;
        }
    }
    // Agregar el último
    if (currentGroupStr !== null) {
        groups.push({ startIdx: groupStart, endIdx: orderedKeys.length - 1, timeStr: currentGroupStr });
    }

    const dayLabels = { lun: 'Lunes', mar: 'Martes', mie: 'Miércoles', jue: 'Jueves', vie: 'Viernes', sab: 'Sábados', dom: 'Domingos' };

    return groups.map(g => {
        const startKey = orderedKeys[g.startIdx] as keyof typeof dayLabels;
        const endKey = orderedKeys[g.endIdx] as keyof typeof dayLabels;
        let label = dayLabels[startKey];
        if (g.startIdx !== g.endIdx) {
            // "Lunes a Viernes" vs "Lunes y Martes"
            label = g.endIdx - g.startIdx === 1 ? `${dayLabels[startKey]} y ${dayLabels[endKey]}` : `${dayLabels[startKey]} a ${dayLabels[endKey]}`;
        }
        return { label, text: g.timeStr };
    });
}
