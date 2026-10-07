function isValidEmail(value) {
    if (value.length > 254 || value.includes(' ')) {
        return false;
    }
    const atIndex = value.indexOf('@');
    if (atIndex <= 0 || atIndex !== value.lastIndexOf('@') || atIndex === value.length - 1) {
        return false;
    }
    const localPart = value.slice(0, atIndex);
    const domainPart = value.slice(atIndex + 1);
    return localPart.length > 0 && domainPart.includes('.') && !domainPart.startsWith('.') && !domainPart.endsWith('.');
}
export function validateCredentials(body){
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        return 'Le corps de la requête est invalide';
    }
    if (typeof body.email !== 'string') {
        return 'L\'email est requis';
    }
    if (!isValidEmail(body.email)) {
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
