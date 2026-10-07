// Toutes les erreurs de l'API sortent au format du contrat : { error: { code, message } }

// Route inconnue
export function notFoundHandler(_request, response) {
    response.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route introuvable' } });
}

// Erreur non prévue (Express 5 transmet aussi les erreurs des fonctions async)
// eslint-disable-next-line no-unused-vars
export function errorHandler(error, _request, response, _next) {
    // Corps JSON mal formé, ou trop gros
    if (error.type === 'entity.parse.failed' || error.type === 'entity.too.large') {
        return response.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Le corps de la requête est invalide' } });
    }
    // Jamais de trace ni de détail technique dans la réponse ; on les garde dans les logs serveur
    console.error(error);
    response.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Erreur interne du serveur' } });
}
