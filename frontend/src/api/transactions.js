import { apiRequest } from './client.js';

// Toutes les routes exigent le token : un 401 déclenche la déconnexion automatique (client.js)

// filters : { type, category, from, to } ; les valeurs vides sont ignorées
export async function listTransactions(token, filters = {}) {
    const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
    const query = params.size > 0 ? `?${params}` : '';
    const { items } = await apiRequest(`/api/transactions${query}`, { token });
    return items;
}

export function getTransaction(token, id) {
    return apiRequest(`/api/transactions/${id}`, { token });
}

export function createTransaction(token, transaction) {
    return apiRequest('/api/transactions', { method: 'POST', body: transaction, token });
}

// PATCH : on n'envoie que les champs modifiés
export function updateTransaction(token, id, changes) {
    return apiRequest(`/api/transactions/${id}`, { method: 'PATCH', body: changes, token });
}

export function deleteTransaction(token, id) {
    return apiRequest(`/api/transactions/${id}`, { method: 'DELETE', token });
}
