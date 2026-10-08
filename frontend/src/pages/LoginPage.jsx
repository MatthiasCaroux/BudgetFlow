import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ErrorMessage from '../components/ErrorMessage.jsx';
import InfoMessage from '../components/InfoMessage.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const REASON_MESSAGES = {
    expired: 'Votre session a expiré. Reconnectez-vous pour continuer.',
    logout: 'Vous êtes déconnecté. À bientôt !',
};

function LoginPage() {
    usePageTitle('Connexion');
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    // Vérification rapide côté navigateur, pour aider l'utilisateur.
    // L'API refait toutes les vérifications : c'est elle qui protège les données.
    function validate() {
        const errors = {};
        if (!EMAIL_REGEX.test(email.trim())) errors.email = 'Saisissez une adresse email valide, par exemple vous@exemple.com.';
        if (!password) errors.password = 'Saisissez votre mot de passe.';
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!validate()) return;
        setLoading(true);
        try {
            // Une fois connecté, GuestRoute redirige vers la page demandée (ou /transactions)
            await login(email.trim(), password);
        } catch (err) {
            // Message renvoyé par l'API (ex : 401 "Email ou mot de passe incorrect")
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="auth-card">
            <h1>Connexion</h1>
            <p className="auth-subtitle">Content de vous revoir ! Connectez-vous pour retrouver vos transactions.</p>
            {!error && <InfoMessage message={REASON_MESSAGES[location.state?.reason]} />}
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <div className="field">
                    <label htmlFor="login-email">Email</label>
                    <input
                        id="login-email"
                        type="email"
                        placeholder="vous@exemple.com"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        aria-invalid={Boolean(fieldErrors.email)}
                        aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
                    />
                    {fieldErrors.email && <p id="login-email-error" className="field-error">{fieldErrors.email}</p>}
                </div>
                <div className="field">
                    <label htmlFor="login-password">Mot de passe</label>
                    <PasswordInput
                        id="login-password"
                        placeholder="Votre mot de passe"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        aria-invalid={Boolean(fieldErrors.password)}
                        aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
                    />
                    {fieldErrors.password && <p id="login-password-error" className="field-error">{fieldErrors.password}</p>}
                </div>
                <ErrorMessage message={error} />
                <button type="submit" className="button button-primary" disabled={loading}>
                    {loading ? 'Connexion…' : 'Se connecter'}
                </button>
            </form>
            <p className="auth-switch">
                Pas encore de compte ? <Link to="/register" state={{ from: location.state?.from }}>Créer un compte</Link>
            </p>
        </div>
    );
}

export default LoginPage;
