// Point d'entrée unique pour appeler l'API Express.
// Le proxy Vite (vite.config.js) redirige /api vers http://localhost:3000.

export class ApiError extends Error {
    constructor(status, code, message) {
        super(message);
        this.status = status;
        this.code = code;
    }
}

// Appelé quand une requête authentifiée reçoit 401 (token expiré ou révoqué).
// AuthContext y branche la déconnexion automatique.
let onUnauthorized = null;

export function setUnauthorizedHandler(handler) {
    onUnauthorized = handler;
}

export async function apiRequest(path, { method = 'GET', body, token } = {}) {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;

    let response;
    try {
        response = await fetch(path, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
        });
    } catch {
        // fetch n'échoue que si le serveur est injoignable
        throw new ApiError(0, 'NETWORK_ERROR', 'Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.');
    }

    // Token refusé alors qu'on en a envoyé un : la session n'est plus valable
    if (response.status === 401 && token) onUnauthorized?.();

    // 204 : succès sans corps (ex : DELETE)
    if (response.status === 204) return null;

    const data = await response.json().catch(() => null);

    // L'API renvoie ses erreurs sous la forme { error: { code, message } }
    if (!response.ok) {
        throw new ApiError(
            response.status,
            data?.error?.code ?? 'UNKNOWN_ERROR',
            data?.error?.message ?? 'Une erreur inattendue est survenue. Réessayez dans un instant.',
        );
    }
    return data;
}
