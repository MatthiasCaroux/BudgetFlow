import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Email:', email);
        console.log('Password:', password);
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
                <button type="submit" className="button button-primary">Se connecter</button>
            </form>
            <p className="auth-switch">
                Pas encore de compte ? <Link to="/register">Créer un compte</Link>
            </p>
        </div>
    );
}

export default LoginPage;
