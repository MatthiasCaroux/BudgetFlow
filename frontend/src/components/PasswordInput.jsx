import { useState } from 'react';

// Champ mot de passe avec un bouton pour afficher / masquer la saisie
export default function PasswordInput({ id, ...inputProps }) {
    const [visible, setVisible] = useState(false);

    return (
        <div className="password-field">
            <input id={id} type={visible ? 'text' : 'password'} {...inputProps} />
            <button
                type="button"
                className="password-toggle"
                onClick={() => setVisible((v) => !v)}
                aria-controls={id}
                aria-pressed={visible}
            >
                {visible ? 'Masquer' : 'Afficher'}
            </button>
        </div>
    );
}
