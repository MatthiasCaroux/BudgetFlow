import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { AppError } from '../../../src/errors/AppError.js';
import { errorHandler } from '../../../src/middlewares/errorHandler.js';

// Mini app dont chaque route lance une erreur différente
function buildApp() {
    const app = express();
    app.get('/app-error', () => {
        throw new AppError(409, 'EMAIL_ALREADY_USED', 'Cet email est déjà utilisé');
    });
    app.get('/client-error', () => {
        throw Object.assign(new Error('Payload Too Large'), { status: 413 });
    });
    app.get('/crash', async () => {
        throw new Error('Mot de passe MongoDB : secret123');
    });
    app.use(errorHandler);
    return app;
}

test('une AppError garde son status, son code et son message', async () => {
    const response = await request(buildApp()).get('/app-error');

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: { code: 'EMAIL_ALREADY_USED', message: 'Cet email est déjà utilisé' } });
});

test('une erreur 4xx de librairie devient 400 INVALID_INPUT', async () => {
    const response = await request(buildApp()).get('/client-error');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_INPUT');
});

test('une erreur imprévue devient 500 sans divulguer son détail', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    const response = await request(buildApp()).get('/crash');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'Erreur interne du serveur' } });
    expect(JSON.stringify(response.body)).not.toContain('secret123');
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
});
