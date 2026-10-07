import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import { Transaction } from '../../src/models/Transaction.js';
import { connectTestDB, clearTestDB, closeTestDB } from '../helpers/db.js';
import { createUserAndToken } from '../helpers/auth.js';

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(closeTestDB);

const someId = new mongoose.Types.ObjectId().toString();

describe('Sans JWT valide, les routes /api/transactions répondent 401', () => {
    const routes = [
        ['GET', '/api/transactions'],
        ['POST', '/api/transactions'],
        ['GET', `/api/transactions/${someId}`],
        ['PATCH', `/api/transactions/${someId}`],
        ['DELETE', `/api/transactions/${someId}`],
    ];

    test.each(routes)('%s %s sans en-tête Authorization', async (method, url) => {
        const response = await request(app)[method.toLowerCase()](url);

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    test('en-tête sans le préfixe Bearer', async () => {
        const { token } = await createUserAndToken('alice@example.test');
        const response = await request(app).get('/api/transactions').set('Authorization', token);

        expect(response.status).toBe(401);
    });

    test('JWT falsifié (signé avec un autre secret)', async () => {
        const { user } = await createUserAndToken('alice@example.test');
        const forged = jwt.sign({ sub: user.id }, 'pas-le-bon-secret');
        const response = await request(app).get('/api/transactions').set('Authorization', `Bearer ${forged}`);

        expect(response.status).toBe(401);
    });

    test('JWT expiré', async () => {
        const { user } = await createUserAndToken('alice@example.test');
        const expired = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: -60 });
        const response = await request(app).get('/api/transactions').set('Authorization', `Bearer ${expired}`);

        expect(response.status).toBe(401);
    });

    test('JWT valide : la requête passe', async () => {
        const { token } = await createUserAndToken('alice@example.test');
        const response = await request(app).get('/api/transactions').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
    });
});

describe('Le compte B ne peut pas accéder aux transactions du compte A', () => {
    let alice;
    let bob;
    let aliceTransactionId;

    beforeEach(async () => {
        alice = await createUserAndToken('alice@example.test');
        bob = await createUserAndToken('bob@example.test');
        // Créée directement en base pour ne dépendre que de l'autorisation
        const transaction = await Transaction.create({
            label: 'Courses',
            description: 'Supermarché',
            type: 'expense',
            amount: 12345,
            date: '2026-10-05',
            ownerId: alice.user.id,
        });
        aliceTransactionId = transaction._id.toString();
    });

    const asAlice = (req) => req.set('Authorization', `Bearer ${alice.token}`);
    const asBob = (req) => req.set('Authorization', `Bearer ${bob.token}`);
    const url = () => `/api/transactions/${aliceTransactionId}`;

    test('A voit sa transaction (contrôle : la route fonctionne)', async () => {
        const response = await asAlice(request(app).get(url()));

        expect(response.status).toBe(200);
    });

    test('la liste de B ne contient aucune transaction de A', async () => {
        const response = await asBob(request(app).get('/api/transactions'));

        expect(response.status).toBe(200);
        expect(JSON.stringify(response.body)).not.toContain(aliceTransactionId);
    });

    test('GET : B reçoit 404 sur la transaction de A', async () => {
        const response = await asBob(request(app).get(url()));

        expect(response.status).toBe(404);
    });

    test('PATCH : B reçoit 404 et la transaction de A n\'est pas modifiée', async () => {
        const response = await asBob(request(app).patch(url()).send({ label: 'Piraté' }));

        expect(response.status).toBe(404);
        const stored = await Transaction.findById(aliceTransactionId);
        expect(stored.label).toBe('Courses');
    });

    test('DELETE : B reçoit 404 et la transaction de A existe toujours', async () => {
        const response = await asBob(request(app).delete(url()));

        expect(response.status).toBe(404);
        expect(await Transaction.findById(aliceTransactionId)).not.toBeNull();
    });
});
