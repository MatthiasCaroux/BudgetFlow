import bcrypt from 'bcrypt';
import { config } from '../config/env.js';
import jwt from 'jsonwebtoken';
import {User} from '../models/User.js';

export async function registerUser(email, password) {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) return null;
    const hashedPassword = await bcrypt.hash(password, 10);
    return User.create({ email: normalizedEmail, passwordHash: hashedPassword });
}

export function createToken(userId) {
    return jwt.sign({
        sub: String(userId)
    }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}
