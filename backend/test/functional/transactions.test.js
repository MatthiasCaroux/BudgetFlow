import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import { connectTestDB, clearTestDB, closeTestDB } from '../helpers/db.js';
import { createUserAndToken } from '../helpers/auth.js';

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(closeTestDB);

const validTransaction = { label: 'Courses', amount: 12345, type: 'expense', date: '2026-10-05' };

let token;
beforeEach(async () => {
    ({ token } = await createUserAndToken('alice@example.test'));
});

const api = {
    list: () => request(app).get('/api/transactions').set('Authorization', `Bearer ${token}`),
    create: (body) => request(app).post('/api/transactions').set('Authorization', `Bearer ${token}`).send(body),
    get: (id) => request(app).get(`/api/transactions/${id}`).set('Authorization', `Bearer ${token}`),
    patch: (id, body) => request(app).patch(`/api/transactions/${id}`).set('Authorization', `Bearer ${token}`).send(body),
    remove: (id) => request(app).delete(`/api/transactions/${id}`).set('Authorization', `Bearer ${token}`),
};

describe('Parcours CRUD complet', () => {
    test('liste vide → création → liste → détail → modification → suppression → 404', async () => {
        const empty = await api.list();
        expect(empty.status).toBe(200);
        expect(empty.body).toEqual({ items: [] });

        const created = await api.create(validTransaction);
        expect(created.status).toBe(201);
        expect(created.body).toMatchObject(validTransaction);
        expect(typeof created.body.id).toBe('string');
        expect(created.body).not.toHaveProperty('_id');
        const { id } = created.body;

        const list = await api.list();
        expect(list.status).toBe(200);
        expect(list.body.items).toHaveLength(1);
        expect(list.body.items[0].id).toBe(id);

        const detail = await api.get(id);
        expect(detail.status).toBe(200);
        expect(detail.body).toMatchObject({ id, ...validTransaction });

        const patched = await api.patch(id, { amount: 9900 });
        expect(patched.status).toBe(200);
        // PATCH partiel : seul le montant change
        expect(patched.body).toMatchObject({ ...validTransaction, id, amount: 9900 });

        const deleted = await api.remove(id);
        expect(deleted.status).toBe(204);
        expect(deleted.text).toBe('');

        const afterDelete = await api.get(id);
        expect(afterDelete.status).toBe(404);
        expect(afterDelete.body.error.code).toBe('NOT_FOUND');
    });

    test('le libellé est enregistré sans les espaces autour', async () => {
        const created = await api.create({ ...validTransaction, label: '  Loyer  ' });

        expect(created.body.label).toBe('Loyer');
    });

    test('la description est facultative', async () => {
        const created = await api.create({ ...validTransaction, description: 'Supermarché' });

        expect(created.status).toBe(201);
        expect(created.body.description).toBe('Supermarché');
    });
});

describe('POST : entrées refusées avec 400 INVALID_INPUT', () => {
    test.each([
        ['montant décimal 12.34', { amount: 12.34 }],
        ['montant 0', { amount: 0 }],
        ['montant négatif', { amount: -500 }],
        ['montant en texte', { amount: '12345' }],
        ['montant trop grand (pas un entier sûr)', { amount: 2 ** 53 }],
        ['type hors liste', { type: 'debit' }],
        ['libellé vide après trim', { label: '   ' }],
        ['libellé de 121 caractères', { label: 'a'.repeat(121) }],
        ['date impossible 2026-02-30', { date: '2026-02-30' }],
        ['date au mauvais format', { date: '05/10/2026' }],
        ['ownerId fourni par le client', { ownerId: new mongoose.Types.ObjectId().toString() }],
        ['id fourni par le client', { id: 'abc' }],
        ['champ inconnu', { category: 'food' }],
    ])('%s', async (_cas, override) => {
        const response = await api.create({ ...validTransaction, ...override });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('INVALID_INPUT');
        expect(response.body.error.message).toBeTruthy();
    });

    test.each(['label', 'amount', 'type', 'date'])('champ obligatoire absent : %s', async (field) => {
        const body = { ...validTransaction };
        delete body[field];
        const response = await api.create(body);

        expect(response.status).toBe(400);
    });

    test('JSON mal formé', async () => {
        const response = await request(app)
            .post('/api/transactions')
            .set('Authorization', `Bearer ${token}`)
            .set('Content-Type', 'application/json')
            .send('{"label":');

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('INVALID_INPUT');
    });

    test('rien n\'est créé après un refus', async () => {
        await api.create({ ...validTransaction, amount: 12.34 });

        const list = await api.list();
        expect(list.body.items).toHaveLength(0);
    });
});

describe('PATCH : entrées refusées avec 400', () => {
    let id;
    beforeEach(async () => {
        ({ body: { id } } = await api.create(validTransaction));
    });

    test.each([
        ['corps vide {}', {}],
        ['champ inconnu', { category: 'food' }],
        ['ownerId', { ownerId: new mongoose.Types.ObjectId().toString() }],
        ['id', { id: 'abc' }],
        ['montant invalide', { amount: -1 }],
        ['date impossible', { date: '2026-13-01' }],
    ])('%s', async (_cas, body) => {
        const response = await api.patch(id, body);

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('INVALID_INPUT');
    });

    test('la transaction n\'est pas modifiée après un refus', async () => {
        await api.patch(id, { amount: -1 });

        const detail = await api.get(id);
        expect(detail.body.amount).toBe(12345);
    });
});

describe('Identifiants', () => {
    test.each([
        ['GET', (id) => api.get(id)],
        ['PATCH', (id) => api.patch(id, { amount: 100 })],
        ['DELETE', (id) => api.remove(id)],
    ])('%s avec un id mal formé → 400', async (_method, call) => {
        const response = await call('abc');

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('INVALID_INPUT');
    });

    test.each([
        ['GET', (id) => api.get(id)],
        ['PATCH', (id) => api.patch(id, { amount: 100 })],
        ['DELETE', (id) => api.remove(id)],
    ])('%s avec un id valide mais absent → 404', async (_method, call) => {
        const response = await call(new mongoose.Types.ObjectId().toString());

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe('NOT_FOUND');
    });
});

describe('Liste', () => {
    test('triée par date, la plus récente en premier', async () => {
        await api.create({ ...validTransaction, label: 'Ancienne', date: '2026-01-01' });
        await api.create({ ...validTransaction, label: 'Récente', date: '2026-10-05' });

        const list = await api.list();
        expect(list.body.items.map((t) => t.label)).toEqual(['Récente', 'Ancienne']);
    });

    test('filtre par type', async () => {
        await api.create(validTransaction);
        await api.create({ ...validTransaction, label: 'Salaire', type: 'income' });

        const response = await request(app).get('/api/transactions?type=income').set('Authorization', `Bearer ${token}`);
        expect(response.body.items.map((t) => t.label)).toEqual(['Salaire']);
    });

    test('filtre de type invalide → 400', async () => {
        const response = await request(app).get('/api/transactions?type=debit').set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(400);
    });
});

test('route inconnue → 404 au format { error }', async () => {
    const response = await request(app).get('/api/inexistante');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
});
