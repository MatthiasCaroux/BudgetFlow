import { apiRequest } from './client.js';

// Les deux routes renvoient { user: { id, email }, token }
export function registerRequest(email, password) {
    return apiRequest('/api/auth/register', { method: 'POST', body: { email, password } });
}

export function loginRequest(email, password) {
    return apiRequest('/api/auth/login', { method: 'POST', body: { email, password } });
}
