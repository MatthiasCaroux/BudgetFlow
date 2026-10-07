import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/transactions');
        } catch (err) {
            // Message renvoyé par l'API (ex : 401 "Email ou mot de passe incorrect")
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-card">
            <h1>Connexion</h1>
            <p className="auth-subtitle">Content de vous revoir ! Connectez-vous pour retrouver vos transactions.</p>
            <form className="auth-form" onSubmit={handleSubmit}>
                <label>
                    Email
                    <input
                        type="email"
                        placeholder="vous@exemple.com"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </label>
                <label>
                    Mot de passe
                    <input
                        type="password"
                        placeholder="Votre mot de passe"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </label>
                <ErrorMessage message={error} />
                <button type="submit" className="button button-primary" disabled={loading}>
                    {loading ? 'Connexion…' : 'Se connecter'}
                </button>
            </form>
            <p className="auth-switch">
                Pas encore de compte ? <Link to="/register">Créer un compte</Link>
            </p>
        </div>
    );
}

export default LoginPage;
