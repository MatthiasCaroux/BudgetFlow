// Base MongoDB en mémoire, isolée de la base de développement.
// Usage : beforeAll(connectTestDB); afterEach(clearTestDB); afterAll(closeTestDB);
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let server;

export async function connectTestDB() {
    server = await MongoMemoryServer.create();
    await mongoose.connect(server.getUri());
}

export async function clearTestDB() {
    const collections = Object.values(mongoose.connection.collections);
    await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

export async function closeTestDB() {
    await mongoose.disconnect();
    await server?.stop();
}
