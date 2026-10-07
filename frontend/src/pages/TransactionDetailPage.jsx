import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import TransactionModal from '../components/TransactionModal.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import InfoMessage from '../components/InfoMessage.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { deleteTransaction, getTransaction, updateTransaction } from '../api/transactions.js';
import { formatCents } from '../utils/money.js';
import { formatLongDate } from '../utils/dates.js';

export default function TransactionDetailPage() {
    const { id } = useParams();
    const { token } = useAuth();
    const navigate = useNavigate();
    const [transaction, setTransaction] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    const [notice, setNotice] = useState('');
    const cancelDeleteRef = useRef(null);
    usePageTitle(transaction?.label ?? 'Transaction');

    const loadTransaction = useCallback(async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            setTransaction(await getTransaction(token, id));
        } catch (err) {
            if (err.status !== 401) setLoadError(err);
        } finally {
            setIsLoading(false);
        }
    }, [token, id]);

    useEffect(() => {
        loadTransaction();
    }, [loadTransaction]);

    // Quand la confirmation s'ouvre, le focus va sur « Annuler » (le choix sans danger)
    useEffect(() => {
        if (isConfirmingDelete) cancelDeleteRef.current?.focus();
    }, [isConfirmingDelete]);

    const handleUpdate = async (changes) => {
        setTransaction(await updateTransaction(token, id, changes));
        setIsEditing(false);
        setNotice('Modifications enregistrées.');
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        setDeleteError('');
        try {
            await deleteTransaction(token, id);
            navigate('/transactions', { replace: true, state: { notice: `« ${transaction.label} » a été supprimée.` } });
        } catch (err) {
            setDeleteError(err.message);
            setIsDeleting(false);
        }
    };

    const backLink = <Link to="/transactions" className="back-link">← Toutes les transactions</Link>;

    if (isLoading) {
        return (
            <div className="detail-page">
                {backLink}
                <p className="empty-state" aria-live="polite">Chargement…</p>
            </div>
        );
    }

    // 404 (absente ou appartenant à un autre compte) et 400 (lien mal formé) : même message
    if (loadError) {
        const notFound = loadError.status === 404 || loadError.status === 400;
        return (
            <div className="detail-page">
                {backLink}
                <div className="empty-state">
                    <p><strong>{notFound ? 'Transaction introuvable' : 'Impossible de charger la transaction'}</strong></p>
                    <p>{notFound ? 'Elle a peut-être été supprimée, ou le lien est incorrect.' : loadError.message}</p>
                    {!notFound && <button className="button button-secondary" onClick={loadTransaction}>Réessayer</button>}
                </div>
            </div>
        );
    }

    const isIncome = transaction.type === 'income';

    return (
        <div className="detail-page">
            {backLink}

            <article className="detail-card">
                <header className="detail-header">
                    <div>
                        <span className={`badge ${transaction.type}`}>{isIncome ? 'Revenu' : 'Dépense'}</span>
                        <h1>{transaction.label}</h1>
                    </div>
                    <p className={`detail-amount amount ${transaction.type}`}>
                        {isIncome ? '+' : '−'}{formatCents(transaction.amount)}
                    </p>
                </header>

                <dl className="detail-list">
                    <div>
                        <dt>Date</dt>
                        <dd>{formatLongDate(transaction.date)}</dd>
                    </div>
                    <div>
                        <dt>Description</dt>
                        <dd>{transaction.description || <span className="muted">Aucune description</span>}</dd>
                    </div>
                </dl>

                <InfoMessage message={notice} />

                {isConfirmingDelete ? (
                    <div className="confirm-box" role="alertdialog" aria-labelledby="confirm-title" aria-describedby="confirm-text">
                        <p id="confirm-title"><strong>Supprimer cette transaction ?</strong></p>
                        <p id="confirm-text">« {transaction.label} » sera définitivement supprimée. Cette action est irréversible.</p>
                        <ErrorMessage message={deleteError} />
                        <div className="confirm-actions">
                            <button ref={cancelDeleteRef} className="button button-secondary" onClick={() => setIsConfirmingDelete(false)} disabled={isDeleting}>
                                Annuler
                            </button>
                            <button className="button button-danger" onClick={handleDelete} disabled={isDeleting}>
                                {isDeleting ? 'Suppression…' : 'Supprimer définitivement'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="detail-actions">
                        <button className="button button-primary" onClick={() => { setNotice(''); setIsEditing(true); }}>
                            Modifier
                        </button>
                        <button className="button button-danger-outline" onClick={() => { setNotice(''); setIsConfirmingDelete(true); }}>
                            Supprimer
                        </button>
                    </div>
                )}
            </article>

            {isEditing && (
                <TransactionModal transaction={transaction} onClose={() => setIsEditing(false)} onSubmit={handleUpdate} />
            )}
        </div>
    );
}
