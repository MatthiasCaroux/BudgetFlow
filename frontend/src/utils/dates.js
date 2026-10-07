// L'API stocke les dates en texte "AAAA-MM-JJ".
// On les découpe nous-mêmes : new Date("2026-10-05") serait en UTC et pourrait afficher le 4.

const longFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const shortFormat = new Intl.DateTimeFormat('fr-FR');

function toLocalDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
    if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    // Ancien format éventuel (données créées avant le passage en "AAAA-MM-JJ")
    return new Date(value);
}

function safeFormat(formatter, value) {
    const date = toLocalDate(value);
    return Number.isNaN(date.getTime()) ? String(value ?? '') : formatter.format(date);
}

// "2026-10-05" → "05/10/2026"
export function formatDate(isoDate) {
    return safeFormat(shortFormat, isoDate);
}

// "2026-10-05" → "5 octobre 2026"
export function formatLongDate(isoDate) {
    return safeFormat(longFormat, isoDate);
}

// Date du jour au format attendu par <input type="date"> et par l'API
export function todayIso() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
}
