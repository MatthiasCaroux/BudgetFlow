import { validateCredentials } from '../../../src/validators/authValidator.js';

const valid = { email: 'alice@example.com', password: 'MotDePasse123!' };

test('des identifiants valides ne renvoient aucune erreur', () => {
    expect(validateCredentials(valid)).toBeNull();
});

test('un mot de passe de 8 caractères exactement est accepté', () => {
    expect(validateCredentials({ ...valid, password: '12345678' })).toBeNull();
});

test.each([
    ['corps null', null],
    ['corps tableau', []],
    ['corps texte', 'alice@example.com'],
])('refuse un %s', (_label, body) => {
    expect(validateCredentials(body)).toBe('Le corps de la requête est invalide');
});

test.each([
    ['email absent', { password: valid.password }, "L'email est requis"],
    ['email non texte', { ...valid, email: 42 }, "L'email est requis"],
    ['email sans @', { ...valid, email: 'alice.example.com' }, "L'email est invalide"],
    ['email avec deux @', { ...valid, email: 'a@b@example.com' }, "L'email est invalide"],
    ['email sans partie locale', { ...valid, email: '@example.com' }, "L'email est invalide"],
    ['domaine sans point', { ...valid, email: 'alice@example' }, "L'email est invalide"],
    ['domaine qui finit par un point', { ...valid, email: 'alice@example.' }, "L'email est invalide"],
    ['email avec espace', { ...valid, email: 'alice @example.com' }, "L'email est invalide"],
    ['email trop long', { ...valid, email: `${'a'.repeat(250)}@x.fr` }, "L'email est invalide"],
    ['mot de passe absent', { email: valid.email }, 'Le mot de passe est requis'],
    ['mot de passe de 7 caractères', { ...valid, password: '1234567' }, 'Le mot de passe doit contenir au moins 8 caractères'],
])('refuse : %s', (_label, body, message) => {
    expect(validateCredentials(body)).toBe(message);
});
