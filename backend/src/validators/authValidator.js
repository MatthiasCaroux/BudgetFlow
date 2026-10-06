const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function validateCredentials(body){
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        return 'Le corps de la requête est invalide';
    }
    if (typeof body.email !== 'string') {
        return 'L\'email est requis';
    }
    if (!EMAIL_REGEX.test(body.email)) {
        return 'L\'email est invalide';
    }
    if (typeof body.password !== 'string') {
        return 'Le mot de passe est requis';
    }
    if(body.password.length < 8) {
        return 'Le mot de passe doit contenir au moins 8 caractères';
    }
    return null;
}

