import { isCivilDate } from '../utils/dates.js';

export const TRANSACTION_TYPES = ['income', 'expense'];
// Bonus B1 : liste fermée de catégories ; "other" est la valeur par défaut
export const CATEGORIES = ['food', 'housing', 'transport', 'health', 'leisure', 'shopping', 'bills', 'salary', 'other'];
const REQUIRED_FIELDS = ['label', 'amount', 'type', 'date'];
// category reste facultative : un POST avec les 4 champs du contrat est toujours accepté
const ALLOWED_FIELDS = [...REQUIRED_FIELDS, 'description', 'category'];

// Vérifie un champ ; renvoie un message d'erreur, ou null s'il est valide
function checkField(name, value) {
    switch (name) {
        case 'label':
            if (typeof value !== 'string' || value.trim().length < 1 || value.trim().length > 120) {
                return 'Le libellé doit contenir entre 1 et 120 caractères';
            }
            return null;
        case 'amount':
            // Entier sûr et strictement positif, en centimes : 12.34, 0, -5 et "12" sont refusés
            if (!Number.isSafeInteger(value) || value <= 0) {
                return 'Le montant doit être un nombre entier de centimes strictement positif';
            }
            return null;
        case 'type':
            if (!TRANSACTION_TYPES.includes(value)) return 'Le type doit être "income" ou "expense"';
            return null;
        case 'date':
            if (!isCivilDate(value)) return 'La date doit être une date réelle au format AAAA-MM-JJ';
            return null;
        case 'category':
            if (!CATEGORIES.includes(value)) return `La catégorie doit être parmi : ${CATEGORIES.join(', ')}`;
            return null;
        case 'description':
            if (typeof value !== 'string' || value.length > 1000) {
                return 'La description doit être un texte de 1000 caractères maximum';
            }
            return null;
        default:
            return null;
    }
}

function isPlainObject(body) {
    return typeof body === 'object' && body !== null && !Array.isArray(body);
}

// Vérifie les clés, puis chaque champ présent ; renvoie { error } ou { data } nettoyée
function validateFields(body) {
    const unknown = Object.keys(body).find((key) => !ALLOWED_FIELDS.includes(key));
    if (unknown) {
        // Couvre aussi "id", "_id" et "ownerId" : le client ne choisit jamais le propriétaire
        return { error: `Le champ "${unknown}" n'est pas autorisé` };
    }
    for (const [name, value] of Object.entries(body)) {
        const error = checkField(name, value);
        if (error) return { error };
    }
    const data = { ...body };
    if (data.label !== undefined) data.label = data.label.trim();
    return { data };
}

// POST : les 4 champs du contrat sont obligatoires, description et category sont facultatives
export function validateTransactionCreate(body) {
    if (!isPlainObject(body)) return { error: 'Le corps de la requête doit être un objet JSON' };
    const missing = REQUIRED_FIELDS.find((field) => body[field] === undefined);
    if (missing) return { error: `Le champ "${missing}" est obligatoire` };
    return validateFields(body);
}

// PATCH : modification partielle, au moins un champ
export function validateTransactionPatch(body) {
    if (!isPlainObject(body)) return { error: 'Le corps de la requête doit être un objet JSON' };
    if (Object.keys(body).length === 0) return { error: 'Indiquez au moins un champ à modifier' };
    return validateFields(body);
}

// Filtres de la liste (query string) : type, category, from et to (AAAA-MM-JJ, bornes incluses)
export function validateTransactionFilters(query) {
    const { type, category, from, to } = query;
    if (type !== undefined && !TRANSACTION_TYPES.includes(type)) {
        return { error: 'Le filtre type doit être "income" ou "expense"' };
    }
    if (category !== undefined && !CATEGORIES.includes(category)) {
        return { error: `Le filtre category doit être parmi : ${CATEGORIES.join(', ')}` };
    }
    if (from !== undefined && !isCivilDate(from)) return { error: 'Le filtre from doit être une date réelle au format AAAA-MM-JJ' };
    if (to !== undefined && !isCivilDate(to)) return { error: 'Le filtre to doit être une date réelle au format AAAA-MM-JJ' };
    // Dates "AAAA-MM-JJ" : l'ordre alphabétique est l'ordre chronologique
    if (from !== undefined && to !== undefined && from > to) {
        return { error: 'La date from doit être antérieure ou égale à la date to' };
    }
    return { data: { type, category, from, to } };
}
