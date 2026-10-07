import { useEffect, useState } from 'react';
import ErrorMessage from './ErrorMessage.jsx';

// Date du jour au format attendu par <input type="date"> : "AAAA-MM-JJ"
function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function TransactionModal({ onClose, onSubmit }) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today());
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fermer le modal avec la touche Échap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await onSubmit({ label, description, type, amount: Number(amount), date });
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    // Un clic sur le fond grisé ferme le modal, un clic dans la boîte non
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="modal-title">Nouvelle transaction</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="type-toggle">
            <button
              type="button"
              className={type === 'expense' ? 'active expense' : ''}
              onClick={() => setType('expense')}
            >
              Dépense
            </button>
            <button
              type="button"
              className={type === 'income' ? 'active income' : ''}
              onClick={() => setType('income')}
            >
              Revenu
            </button>
          </div>

          <label>
            Libellé
            <input
              type="text"
              placeholder="Courses, salaire, loyer…"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              autoFocus
            />
          </label>
          <label>
            Description
            <input
              type="text"
              placeholder="Supermarché du coin"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </label>
          <div className="form-row">
            <label>
              Montant (€)
              <input
                type="number"
                placeholder="0,00"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </label>
            <label>
              Date
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </label>
          </div>

          <ErrorMessage message={error} />

          <div className="modal-actions">
            <button type="button" className="button button-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="button button-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Ajout…' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
