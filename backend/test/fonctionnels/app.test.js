import request from 'supertest';
import app from '../../src/app.js';

test('GET /api/health retourne 200 et exactement {"status":"ok"}', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
});
