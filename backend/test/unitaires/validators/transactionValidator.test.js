import { validateTransactionCreate, validateTransactionPatch, validateTransactionFilters } from '../../../src/validators/transactionValidator.js';

const valid = { label: 'Courses', amount: 12345, type: 'expense', date: '2026-10-05' };

describe('validateTransactionCreate', () => {
    test('accepte une transaction complète et renvoie les données', () => {
        expect(validateTransactionCreate(valid)).toEqual({ data: valid });
    });

    test('accepte une description facultative', () => {
        const body = { ...valid, description: 'Supermarché' };
        expect(validateTransactionCreate(body)).toEqual({ data: body });
    });

    test('accepte une catégorie de la liste', () => {
        const body = { ...valid, category: 'food' };
        expect(validateTransactionCreate(body)).toEqual({ data: body });
    });

    test('retire les espaces autour du libellé', () => {
        expect(validateTransactionCreate({ ...valid, label: '  Courses  ' }).data.label).toBe('Courses');
    });

    test('ne modifie pas l\'objet reçu', () => {
        const body = { ...valid, label: '  Courses  ' };
        validateTransactionCreate(body);
        expect(body.label).toBe('  Courses  ');
    });

    test.each(['label', 'amount', 'type', 'date'])('refuse une transaction sans "%s"', (field) => {
        const body = { ...valid };
        delete body[field];
        expect(validateTransactionCreate(body)).toEqual({ error: `Le champ "${field}" est obligatoire` });
    });

    test.each([
        ['libellé vide', { label: '   ' }],
        ['libellé de 121 caractères', { label: 'a'.repeat(121) }],
        ['montant décimal', { amount: 12.34 }],
        ['montant 0', { amount: 0 }],
        ['montant négatif', { amount: -500 }],
        ['montant en texte', { amount: '12' }],
        ['type inconnu', { type: 'transfer' }],
        ['date impossible', { date: '2026-02-30' }],
        ['description trop longue', { description: 'a'.repeat(1001) }],
        ['champ inconnu', { color: 'red' }],
        ['catégorie hors liste', { category: 'casino' }],
        ['catégorie qui n\'est pas un texte', { category: 1 }],
        ['ownerId fourni par le client', { ownerId: '66f1c2a4e1b2c3d4e5f60719' }],
    ])('refuse : %s', (_label, override) => {
        const result = validateTransactionCreate({ ...valid, ...override });
        expect(result.error).toEqual(expect.any(String));
        expect(result.data).toBeUndefined();
    });

    test.each([null, [], 'texte'])('refuse un corps qui n\'est pas un objet (%p)', (body) => {
        expect(validateTransactionCreate(body)).toEqual({ error: 'Le corps de la requête doit être un objet JSON' });
    });
});

describe('validateTransactionPatch', () => {
    test('accepte une modification partielle', () => {
        expect(validateTransactionPatch({ amount: 9900 })).toEqual({ data: { amount: 9900 } });
    });

    test('refuse un objet vide', () => {
        expect(validateTransactionPatch({})).toEqual({ error: 'Indiquez au moins un champ à modifier' });
    });

    test('refuse un champ invalide', () => {
        expect(validateTransactionPatch({ amount: -1 }).error).toEqual(expect.any(String));
    });

    test('refuse un corps qui n\'est pas un objet', () => {
        expect(validateTransactionPatch(null)).toEqual({ error: 'Le corps de la requête doit être un objet JSON' });
    });
});

describe('validateTransactionFilters', () => {
    test('aucun filtre', () => {
        expect(validateTransactionFilters({})).toEqual({ data: { type: undefined, category: undefined, from: undefined, to: undefined } });
    });

    test('accepte des filtres valides', () => {
        const query = { type: 'expense', category: 'food', from: '2026-10-01', to: '2026-10-31' };
        expect(validateTransactionFilters(query)).toEqual({ data: query });
    });

    test('accepte from égal à to (un seul jour)', () => {
        expect(validateTransactionFilters({ from: '2026-10-05', to: '2026-10-05' }).error).toBeUndefined();
    });

    test.each([
        ['type inconnu', { type: 'debit' }],
        ['catégorie inconnue', { category: 'casino' }],
        ['from impossible', { from: '2026-02-30' }],
        ['to mal formé', { to: '2026-1-5' }],
        ['from après to', { from: '2026-10-05', to: '2026-10-01' }],
    ])('refuse : %s', (_cas, query) => {
        expect(validateTransactionFilters(query).error).toEqual(expect.any(String));
    });
});
