import { AppError, invalidInput, unauthorized, notFound, conflict } from '../../../src/errors/AppError.js';

test('AppError est une Error qui porte un status et un code', () => {
    const error = new AppError(418, 'TEAPOT', 'Je suis une théière');

    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({ status: 418, code: 'TEAPOT', message: 'Je suis une théière' });
});

test.each([
    ['invalidInput', () => invalidInput('Champ manquant'), 400, 'INVALID_INPUT', 'Champ manquant'],
    ['unauthorized (message par défaut)', () => unauthorized(), 401, 'UNAUTHORIZED', 'Authentification requise'],
    ['unauthorized (message fourni)', () => unauthorized('Mot de passe incorrect'), 401, 'UNAUTHORIZED', 'Mot de passe incorrect'],
    ['notFound', () => notFound('Transaction introuvable'), 404, 'NOT_FOUND', 'Transaction introuvable'],
    ['conflict', () => conflict('EMAIL_ALREADY_USED', 'Email déjà utilisé'), 409, 'EMAIL_ALREADY_USED', 'Email déjà utilisé'],
])('%s crée la bonne AppError', (_name, create, status, code, message) => {
    const error = create();

    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ status, code, message });
});
