// Erreur métier prévue : errorHandler la renvoie telle quelle au format { error: { code, message } }
export class AppError extends Error {
    constructor(status, code, message) {
        super(message);
        this.name = 'AppError';
        this.status = status;
        this.code = code;
    }
}

// Raccourcis pour les erreurs les plus courantes du contrat
export function invalidInput(message) {
    return new AppError(400, 'INVALID_INPUT', message);
}

export function unauthorized(message = 'Authentification requise') {
    return new AppError(401, 'UNAUTHORIZED', message);
}

export function notFound(message) {
    return new AppError(404, 'NOT_FOUND', message);
}

export function conflict(code, message) {
    return new AppError(409, code, message);
}
