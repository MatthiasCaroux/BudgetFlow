import { apiRequest } from './client.js';

// Toutes les routes exigent le token : un 401 déclenche la déconnexion automatique (client.js)

export async function listTransactions(token) {
    const { items } = await apiRequest('/api/transactions', { token });
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
