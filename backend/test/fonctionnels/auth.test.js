import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app.js';
import { User } from '../../src/models/User.js';
import { connectTestDB, clearTestDB, closeTestDB } from '../outils/db.js';

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(closeTestDB);

const alice = { email: 'alice@example.test', password: 'MotDePasse123!' };

function register(body) {
    return request(app).post('/api/auth/register').send(body);
}

function login(body) {
    return request(app).post('/api/auth/login').send(body);
}

describe('POST /api/auth/register', () => {
    test('201 : renvoie { user: { id, email }, token } sans mot de passe ni hash', async () => {
        const response = await register(alice);

        expect(response.status).toBe(201);
        expect(Object.keys(response.body.user).sort()).toEqual(['email', 'id']);
        expect(typeof response.body.user.id).toBe('string');
        expect(response.body.user.email).toBe('alice@example.test');
        expect(JSON.stringify(response.body)).not.toMatch(/password/i);
    });

    test('201 : le token est un vrai JWT signé qui contient l\'id de l\'utilisateur', async () => {
        const response = await register(alice);

        const payload = jwt.verify(response.body.token, process.env.JWT_SECRET);
        expect(payload.sub).toBe(response.body.user.id);
        expect(payload.exp).toBeGreaterThan(payload.iat);
    });

    test('le mot de passe est stocké uniquement sous forme de hash bcrypt', async () => {
        await register(alice);

        const user = await User.findOne({ email: alice.email });
        expect(user.passwordHash).not.toBe(alice.password);
        expect(user.passwordHash).toMatch(/^\$2[aby]\$10\$/);
    });

    test('409 EMAIL_ALREADY_USED si l\'email est déjà utilisé', async () => {
        await register(alice);
        const response = await register(alice);

        expect(response.status).toBe(409);
        expect(response.body.error.code).toBe('EMAIL_ALREADY_USED');
        expect(response.body.error.message).toBeTruthy();
    });

    test('409 aussi avec le même email en majuscules (insensible à la casse)', async () => {
        await register(alice);
        const response = await register({ ...alice, email: 'ALICE@Example.TEST' });

        expect(response.status).toBe(409);
        expect(response.body.error.code).toBe('EMAIL_ALREADY_USED');
    });

    test.each([
        ['email invalide', { email: 'alice', password: 'MotDePasse123!' }],
        ['email absent', { password: 'MotDePasse123!' }],
        ['mot de passe de 7 caractères', { email: 'alice@example.test', password: '1234567' }],
        ['mot de passe absent', { email: 'alice@example.test' }],
        ['mot de passe qui n\'est pas une chaîne', { email: 'alice@example.test', password: 12345678 }],
        ['corps vide', {}],
    ])('400 INVALID_INPUT : %s', async (_cas, body) => {
        const response = await register(body);

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('INVALID_INPUT');
        expect(response.body.error.message).toBeTruthy();
    });
});

describe('POST /api/auth/login', () => {
    beforeEach(() => register(alice));

    test('200 : même forme de réponse que register', async () => {
        const response = await login(alice);

        expect(response.status).toBe(200);
        expect(Object.keys(response.body.user).sort()).toEqual(['email', 'id']);
        expect(response.body.user.email).toBe('alice@example.test');
        expect(jwt.verify(response.body.token, process.env.JWT_SECRET).sub).toBe(response.body.user.id);
    });

    test('200 aussi avec l\'email en majuscules', async () => {
        const response = await login({ ...alice, email: 'Alice@Example.test' });

        expect(response.status).toBe(200);
    });

    test('401 UNAUTHORIZED avec un mauvais mot de passe', async () => {
        const response = await login({ ...alice, password: 'MauvaisMotDePasse' });

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe('UNAUTHORIZED');
        expect(response.body).not.toHaveProperty('token');
    });

    test('401 avec un email inconnu, et le même message que pour un mauvais mot de passe', async () => {
        const wrongPassword = await login({ ...alice, password: 'MauvaisMotDePasse' });
        const unknownEmail = await login({ email: 'inconnu@example.test', password: 'MotDePasse123!' });

        expect(unknownEmail.status).toBe(401);
        expect(unknownEmail.body.error.code).toBe('UNAUTHORIZED');
        // On ne révèle pas si c'est l'email ou le mot de passe qui est faux
        expect(unknownEmail.body.error.message).toBe(wrongPassword.body.error.message);
    });

    test('400 INVALID_INPUT avec un email invalide', async () => {
        const response = await login({ email: 'alice', password: 'MotDePasse123!' });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('INVALID_INPUT');
    });
});
