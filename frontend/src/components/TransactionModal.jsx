import { useEffect, useRef, useState } from 'react';
import ErrorMessage from './ErrorMessage.jsx';
import { centsToEuroInput, eurosToCents } from '../utils/money.js';
import { todayIso } from '../utils/dates.js';

// Fenêtre de création ET de modification d'une transaction.
// - sans `transaction` : création, onSubmit reçoit l'objet complet
// - avec `transaction` : modification, onSubmit ne reçoit que les champs changés (PATCH)
export default function TransactionModal({ transaction, onClose, onSubmit }) {
  const isEdit = Boolean(transaction);
  const [label, setLabel] = useState(transaction?.label ?? '');
  const [description, setDescription] = useState(transaction?.description ?? '');
  const [type, setType] = useState(transaction?.type ?? 'expense');
  const [amount, setAmount] = useState(transaction ? centsToEuroInput(transaction.amount) : '');
  const [date, setDate] = useState(transaction?.date ?? todayIso());
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const previousFocus = useRef(document.activeElement);

  // Fermer avec Échap, et rendre le focus au bouton d'origine à la fermeture (clavier)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    const elementToRefocus = previousFocus.current;
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      elementToRefocus?.focus?.();
    };
  }, [onClose]);

  // Aide à la saisie ; l'API refait toutes ces vérifications
  function validate(amountInCents) {
    const errors = {};
    if (!label.trim()) errors.label = 'Donnez un libellé, par exemple « Courses ».';
    else if (label.trim().length > 120) errors.label = 'Le libellé ne doit pas dépasser 120 caractères.';
    if (amountInCents === null || amountInCents <= 0) errors.amount = 'Saisissez un montant positif, par exemple 12,50.';
    if (!date) errors.date = 'Choisissez une date.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const amountInCents = eurosToCents(amount);
    if (!validate(amountInCents)) return;

    const values = { label: label.trim(), description: description.trim(), type, amount: amountInCents, date };
    let payload = values;
    if (isEdit) {
      payload = Object.fromEntries(Object.entries(values).filter(([key, value]) => value !== (transaction[key] ?? '')));
      if (Object.keys(payload).length === 0) {
        onClose();
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  const errorProps = (name) => ({
    'aria-invalid': Boolean(fieldErrors[name]),
    'aria-describedby': fieldErrors[name] ? `transaction-${name}-error` : undefined,
  });

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
          <h2 id="modal-title">{isEdit ? 'Modifier la transaction' : 'Nouvelle transaction'}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="type-toggle" role="group" aria-label="Type de transaction">
            <button
              type="button"
              className={type === 'expense' ? 'active expense' : ''}
              aria-pressed={type === 'expense'}
              onClick={() => setType('expense')}
            >
              Dépense
            </button>
            <button
              type="button"
              className={type === 'income' ? 'active income' : ''}
              aria-pressed={type === 'income'}
              onClick={() => setType('income')}
            >
              Revenu
            </button>
          </div>

          <div className="field">
            <label htmlFor="transaction-label">Libellé</label>
            <input
              id="transaction-label"
              type="text"
              placeholder="Courses, salaire, loyer…"
              maxLength={120}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={isSubmitting}
              autoFocus
              {...errorProps('label')}
            />
            {fieldErrors.label && <p id="transaction-label-error" className="field-error">{fieldErrors.label}</p>}
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor="transaction-amount">Montant (€)</label>
              <input
                id="transaction-amount"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isSubmitting}
                {...errorProps('amount')}
              />
              {fieldErrors.amount && <p id="transaction-amount-error" className="field-error">{fieldErrors.amount}</p>}
            </div>
            <div className="field">
              <label htmlFor="transaction-date">Date</label>
              <input
                id="transaction-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isSubmitting}
                {...errorProps('date')}
              />
              {fieldErrors.date && <p id="transaction-date-error" className="field-error">{fieldErrors.date}</p>}
            </div>
          </div>

          <div className="field">
            <label htmlFor="transaction-description">
              Description <span className="optional">(facultatif)</span>
            </label>
            <input
              id="transaction-description"
              type="text"
              placeholder="Supermarché du coin"
              maxLength={1000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <ErrorMessage message={error} />

          <div className="modal-actions">
            <button type="button" className="button button-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="button button-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
