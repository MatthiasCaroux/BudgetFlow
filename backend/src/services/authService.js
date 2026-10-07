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

export async function loginUser(email, password) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    // On vérifie que l'utilisateur existe AVANT de lire user.passwordHash
    if (!user) return null;
    // bcrypt hache le mot de passe tapé et le compare au hash stocké
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) return null;
    return user;
}

export function createToken(userId) {
    return jwt.sign({
        sub: String(userId)
    }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}
