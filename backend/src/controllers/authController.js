import {validateCredentials} from '../validators/authValidator.js';
import * as authService from '../services/authService.js';
import { conflict, invalidInput, unauthorized } from '../errors/AppError.js';

export async function register(req, res) {
    const errorMessage = validateCredentials(req.body);
    if (errorMessage) throw invalidInput(errorMessage);
    const user = await authService.registerUser(req.body.email, req.body.password);
    if (!user) throw conflict('EMAIL_ALREADY_USED', 'Cet email est déjà utilisé');
    const token = authService.createToken(user._id);
    res.status(201).json({ user:{ id: user._id, email: user.email }, token });
}

export async function login(req, res) {
    const errorMessage = validateCredentials(req.body);
    if (errorMessage) throw invalidInput(errorMessage);
    const user = await authService.loginUser(req.body.email, req.body.password);
    if (!user) throw unauthorized('Email ou mot de passe incorrect');
    const token = authService.createToken(user._id);
    res.status(200).json({ user:{ id: user._id, email: user.email }, token });
}
