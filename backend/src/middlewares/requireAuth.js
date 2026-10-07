import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

function unauthorized(res) {
    return res.status(401).json({ error: {code: 'UNAUTHORIZED', message: 'Authentification requise'} });
}

export function requireAuth(req, res, next) {
    const header = req.headers.authorization;

    // L'en-tête doit exister et avoir la forme "Bearer <token>"
    if (!header || !header.startsWith('Bearer ')) {
        return unauthorized(res);
    }

    // 'Bearer ' fait 7 caractères : on garde ce qui vient après
    const token = header.slice(7);

    try {
        // jwt.verify lance une erreur si la signature est fausse ou si le token a expiré
        const payload = jwt.verify(token, config.jwtSecret);
        // Seulement l'id (rangé sous "sub" dans createToken), pas tout le contenu du token
        req.userId = payload.sub;
        next();
    } catch {
        return unauthorized(res);
    }
}
