import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import { connectTestDB, clearTestDB, closeTestDB } from '../outils/db.js';
import { createUserAndToken } from '../outils/auth.js';

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
        ['champ inconnu', { color: 'red' }],
        ['catégorie hors liste', { category: 'casino' }],
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
        ['champ inconnu', { color: 'red' }],
        ['catégorie hors liste', { category: 'casino' }],
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

describe('Bonus B1 : catégories et filtres', () => {
    const list = (query) => request(app).get(`/api/transactions?${query}`).set('Authorization', `Bearer ${token}`);
    const labels = (response) => response.body.items.map((t) => t.label);

    test('sans catégorie, la transaction est classée dans "other"', async () => {
        const created = await api.create(validTransaction);

        expect(created.status).toBe(201);
        expect(created.body.category).toBe('other');
    });

    test('la catégorie est enregistrée à la création et modifiable par PATCH', async () => {
        const created = await api.create({ ...validTransaction, category: 'food' });
        expect(created.body.category).toBe('food');

        const patched = await api.patch(created.body.id, { category: 'leisure' });
        expect(patched.status).toBe(200);
        expect(patched.body).toMatchObject({ ...validTransaction, category: 'leisure' });
    });

    describe('filtres de la liste', () => {
        beforeEach(async () => {
            await api.create({ ...validTransaction, label: 'Courses', category: 'food', date: '2026-09-28' });
            await api.create({ ...validTransaction, label: 'Restaurant', category: 'food', date: '2026-10-05' });
            await api.create({ ...validTransaction, label: 'Cinéma', category: 'leisure', date: '2026-10-02' });
            await api.create({ ...validTransaction, label: 'Salaire', type: 'income', category: 'salary', date: '2026-10-01' });
        });

        test('par catégorie', async () => {
            expect(labels(await list('category=food'))).toEqual(['Restaurant', 'Courses']);
        });

        test('par période, bornes incluses', async () => {
            expect(labels(await list('from=2026-10-01&to=2026-10-02'))).toEqual(['Cinéma', 'Salaire']);
        });

        test('filtres combinés type + catégorie + date', async () => {
            expect(labels(await list('type=expense&category=food&from=2026-10-01'))).toEqual(['Restaurant']);
        });

        test('aucun résultat → {"items":[]}', async () => {
            const response = await list('category=health');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ items: [] });
        });
    });

    test.each([
        ['catégorie hors liste', 'category=casino'],
        ['date impossible', 'from=2026-02-30'],
        ['date au mauvais format', 'to=05/10/2026'],
        ['from après to', 'from=2026-10-05&to=2026-10-01'],
    ])('filtre invalide → 400 : %s', async (_cas, query) => {
        const response = await list(query);

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('INVALID_INPUT');
    });

    test('le filtre par catégorie ne renvoie pas les transactions d\'un autre compte', async () => {
        await api.create({ ...validTransaction, category: 'food' });
        const { token: tokenB } = await createUserAndToken('bob@example.test');

        const response = await request(app).get('/api/transactions?category=food').set('Authorization', `Bearer ${tokenB}`);
        expect(response.body).toEqual({ items: [] });
    });
});

test('route inconnue → 404 au format { error }', async () => {
    const response = await request(app).get('/api/inexistante');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
});
