import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { loginRequest, registerRequest } from '../api/auth.js';
import { setUnauthorizedHandler } from '../api/client.js';

// Mêmes clés que celles lues par le reste de l'app
const TOKEN_KEY = 'token';
const USER_KEY = 'user';

const AuthContext = createContext(null);

// Le contenu d'un JWT est lisible (encodé en base64, pas chiffré) :
// on lit "exp" (en secondes) pour connaître la date d'expiration.
function getTokenExpiry(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        return payload.exp * 1000;
    } catch {
        return 0;
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
        if (token && user && getTokenExpiry(token) > Date.now()) return { user, token };
    } catch {
        // stockage illisible : on repart sans session
    }
    clearStorage();
    return null;
}

export function AuthProvider({ children }) {
    // Au chargement de la page, on reprend la session sauvegardée si elle est encore valable
    const [session, setSession] = useState(loadSession);
    // Pourquoi la dernière session s'est terminée : 'logout' ou 'expired'
    const [logoutReason, setLogoutReason] = useState(null);

    const endSession = useCallback((reason) => {
        clearStorage();
        setSession(null);
        setLogoutReason(reason);
    }, []);

    function saveSession({ user, token }) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        setLogoutReason(null);
        setSession({ user, token });
    }

    async function login(email, password) {
        saveSession(await loginRequest(email, password));
    }

    async function register(email, password) {
        saveSession(await registerRequest(email, password));
    }

    const logout = useCallback(() => endSession('logout'), [endSession]);
    const expireSession = useCallback(() => endSession('expired'), [endSession]);

    // Toute réponse 401 de l'API sur une requête authentifiée termine la session
    useEffect(() => {
        setUnauthorizedHandler(expireSession);
        return () => setUnauthorizedHandler(null);
    }, [expireSession]);

    // Déconnexion automatique à l'heure exacte d'expiration du token
    useEffect(() => {
        if (!session) return undefined;
        const delay = getTokenExpiry(session.token) - Date.now();
        // setTimeout ne gère pas les délais de plus de ~24 jours
        const timer = setTimeout(expireSession, Math.min(Math.max(delay, 0), 2 ** 31 - 1));
        return () => clearTimeout(timer);
    }, [session, expireSession]);

    // Déconnexion / connexion dans un autre onglet : on suit le même état
    useEffect(() => {
        function handleStorage(event) {
            if (event.key === TOKEN_KEY || event.key === null) {
                const next = loadSession();
                setSession(next);
                if (!next) setLogoutReason('logout');
            }
        }
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const value = {
        user: session?.user ?? null,
        token: session?.token ?? null,
        isAuthenticated: Boolean(session),
        logoutReason,
        login,
        register,
        logout,
        expireSession,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Dans un composant : const { user, token, login, logout } = useAuth();
export function useAuth() {
    return useContext(AuthContext);
}
