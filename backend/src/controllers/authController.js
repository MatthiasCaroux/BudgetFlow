import {validateCredentials} from '../validators/authValidator.js';
import * as authService from '../services/authService.js';

export async function register(req, res) {
    const errorMessage = validateCredentials(req.body);
    if (errorMessage) {
        return res.status(400).json({ error: {code: 'INVALID_INPUT', message: errorMessage} });
    }
    const user = await authService.registerUser(req.body.email, req.body.password);
    if (!user) {
        return res.status(409).json({ error: {code: 'EMAIL_ALREADY_USED', message: 'Cet email est déjà utilisé'} });
    }
    const token = authService.createToken(user._id);
    res.status(201).json({ user:{ id: user._id, email: user.email }, token });
}