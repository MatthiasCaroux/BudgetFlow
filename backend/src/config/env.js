import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: process.env.PORT,
    mongoURI: process.env.MONGO_URI,
    corsOrigin: process.env.CORS_ORIGIN,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN,
};