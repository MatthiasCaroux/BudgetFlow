import request from 'supertest';
import app from '../../src/app.js';

// Crée un compte via la vraie route et renvoie { user, token }.
// Utilisable aussi par les tests du lot B pour avoir un utilisateur connecté.
export async function createUserAndToken(email, password = 'MotDePasse123!') {
    const response = await request(app)
        .post('/api/auth/register')
        .send({ email, password });
    return response.body;
}
