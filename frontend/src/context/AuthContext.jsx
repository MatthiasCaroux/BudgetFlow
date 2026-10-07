import { createContext, useContext, useState } from 'react';
import { loginRequest, registerRequest } from '../api/auth.js';

// Mêmes clés que celles lues par pages/Transaction.jsx
const TOKEN_KEY = 'token';
const USER_KEY = 'user';

const AuthContext = createContext(null);

// Le contenu d'un JWT est lisible (encodé en base64, pas chiffré) :
// on lit "exp" pour ne pas garder une session expirée.
function isTokenExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        return payload.exp * 1000 < Date.now();
    } catch {
        return true;
    }
}

function clearStorage() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

function loadSession() {
    try {
        const token = localStorage.getItem(TOKEN_KEY);
        const user = JSON.parse(localStorage.getItem(USER_KEY));
        if (token && user && !isTokenExpired(token)) return { user, token };
    } catch {
        // stockage illisible : on repart sans session
    }
    clearStorage();
    return null;
}

export function AuthProvider({ children }) {
    // Au chargement de la page, on reprend la session sauvegardée
    const [session, setSession] = useState(loadSession);

    function saveSession({ user, token }) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        setSession({ user, token });
    }

    async function login(email, password) {
        saveSession(await loginRequest(email, password));
    }

    async function register(email, password) {
        saveSession(await registerRequest(email, password));
    }

    function logout() {
        clearStorage();
        setSession(null);
    }

    const value = {
        user: session?.user ?? null,
        token: session?.token ?? null,
        isAuthenticated: Boolean(session),
        login,
        register,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Dans un composant : const { user, token, login, logout } = useAuth();
export function useAuth() {
    return useContext(AuthContext);
}
