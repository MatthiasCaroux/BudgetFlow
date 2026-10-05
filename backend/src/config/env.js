import dotenv from 'dotenv';

export const config = {
    port: process.env.PORT,
    mongoURI: process.env.MONGO_URI,
    corsOrigin: process.env.CORS_ORIGIN,
}