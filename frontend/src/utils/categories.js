// Bonus B1 : mêmes clés que l'API (transactionValidator.js), libellés en français pour l'interface.
// Une couleur fixe par catégorie : elle reste la même quel que soit le filtre ou le tri.
// Palette testée pour le daltonisme ; "Autre" est en gris neutre.
export const CATEGORIES = [
    { value: 'food', label: 'Alimentation', color: '#2a78d6' },
    { value: 'housing', label: 'Logement', color: '#eb6834' },
    { value: 'transport', label: 'Transport', color: '#1baf7a' },
    { value: 'health', label: 'Santé', color: '#eda100' },
    { value: 'leisure', label: 'Loisirs', color: '#e87ba4' },
    { value: 'shopping', label: 'Achats', color: '#008300' },
    { value: 'bills', label: 'Factures et abonnements', color: '#4a3aa7' },
    { value: 'salary', label: 'Salaire', color: '#e34948' },
    { value: 'other', label: 'Autre', color: '#8a8a85' },
];

function findCategory(value) {
    return CATEGORIES.find((category) => category.value === (value ?? 'other'));
}

// "food" → "Alimentation" ; une transaction sans catégorie compte comme "Autre"
export function categoryLabel(value) {
    return findCategory(value)?.label ?? value;
}

export function categoryColor(value) {
    return findCategory(value)?.color ?? '#8a8a85';
}

// Total des dépenses par catégorie, en centimes, du plus gros au plus petit
export function expensesByCategory(transactions) {
    const totals = new Map();
    for (const t of transactions) {
        if (t.type !== 'expense') continue;
        const category = t.category ?? 'other';
        totals.set(category, (totals.get(category) ?? 0) + t.amount);
    }
    return [...totals]
        .map(([category, total]) => ({ category, label: categoryLabel(category), color: categoryColor(category), total }))
        .sort((a, b) => b.total - a.total);
}
