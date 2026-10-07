const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Vrai si la chaîne est une date du calendrier qui existe, au format AAAA-MM-JJ.
// "2026-02-30" a le bon format mais n'existe pas : on reconstruit la date et on compare.
export function isCivilDate(value) {
    if (typeof value !== 'string' || !DATE_REGEX.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
