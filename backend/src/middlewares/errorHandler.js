import { AppError } from '../errors/AppError.js';

// Toutes les erreurs de l'API sortent au format du contrat : { error: { code, message } }

// Route inconnue
export function notFoundHandler(_request, response) {
    response.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route introuvable' } });
}

// Express 5 transmet ici les erreurs lancées par les routes, y compris dans les fonctions async
export function errorHandler(error, _request, response, next) {
    // Réponse déjà en cours d'envoi : on laisse Express couper la connexion
    if (response.headersSent) {
        return next(error);
    }
    // Erreur métier prévue (validation, ressource introuvable, conflit...)
    if (error instanceof AppError) {
        return response.status(error.status).json({ error: { code: error.code, message: error.message } });
    }
    // Corps JSON mal formé, ou trop gros
    if (error.type === 'entity.parse.failed' || error.type === 'entity.too.large') {
        return response.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Le corps de la requête est invalide' } });
    }
    // Autre erreur client levée par une librairie
    if (error.status >= 400 && error.status < 500) {
        return response.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Requête invalide' } });
    }
    // Jamais de trace ni de détail technique dans la réponse ; on les garde dans les logs serveur
    console.error(error);
    response.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Erreur interne du serveur' } });
}
