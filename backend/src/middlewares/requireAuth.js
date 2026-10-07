import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { unauthorized } from '../errors/AppError.js';

export function requireAuth(req, _res, next) {
    const header = req.headers.authorization;

    // L'en-tête doit exister et avoir la forme "Bearer <token>"
    if (!header || !header.startsWith('Bearer ')) {
        return next(unauthorized());
    }

    // 'Bearer ' fait 7 caractères : on garde ce qui vient après
    const token = header.slice(7);

    try {
        // jwt.verify lance une erreur si la signature est fausse ou si le token a expiré
        // algorithms : on n'accepte que HS256, l'algorithme utilisé par createToken
        const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
        // Seulement l'id (rangé sous "sub" dans createToken), pas tout le contenu du token
        req.userId = payload.sub;
    } catch {
        return next(unauthorized());
    }
    // next() hors du try : une erreur levée plus loin ne doit pas être confondue avec un token invalide
    next();
}
