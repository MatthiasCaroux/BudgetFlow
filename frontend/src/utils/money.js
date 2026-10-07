// L'API manipule des centimes entiers (12345), l'interface des euros ("123,45 €").

const currency = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

// 12345 → "123,45 €"
export function formatCents(cents) {
    return currency.format(cents / 100);
}

// "123,45" ou "123.45" ou "123" → 12345 ; null si la saisie n'est pas un montant valide.
// On découpe le texte plutôt que de multiplier un nombre à virgule : 1.15 * 100 = 114.99999…
export function eurosToCents(input) {
    const value = String(input).trim().replace(/\s/g, '').replace(',', '.');
    const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value);
    if (!match) return null;
    const cents = Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
    return Number.isSafeInteger(cents) ? cents : null;
}

// 12345 → "123,45" (pour pré-remplir un champ de saisie)
export function centsToEuroInput(cents) {
    return (cents / 100).toFixed(2).replace('.', ',');
}
