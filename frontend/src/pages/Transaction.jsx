import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom';
import TransactionModal from '../components/TransactionModal.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import InfoMessage from '../components/InfoMessage.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { createTransaction, listTransactions } from '../api/transactions.js';
import { formatCents } from '../utils/money.js';
import { formatDate } from '../utils/dates.js';

// Revenus, dépenses et solde, calculés en centimes entiers (pas d'erreur d'arrondi)
function computeTotals(transactions) {
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
        if (t.type === 'income') income += t.amount;
        else expense += t.amount;
    }
    return { income, expense, balance: income - expense };
}

export default function Transaction() {
    usePageTitle('Transactions');
    const { token } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    // Message de confirmation transmis par une autre page (ex : après une suppression)
    const [notice, setNotice] = useState(location.state?.notice ?? '');

    // Incrémenté par « Réessayer » pour relancer le chargement
    const [reloadCount, setReloadCount] = useState(0);

    // Charger la liste au premier affichage de la page (et à chaque « Réessayer »).
    // L'état n'est modifié qu'à la réponse de l'API, et ignoré si la page a changé entre-temps
    useEffect(() => {
        let isCurrent = true;
        listTransactions(token)
            .then((items) => {
                if (!isCurrent) return;
                setTransactions(items);
                setError('');
            })
            .catch((err) => {
                // Un 401 est déjà géré : la session se termine et on revient à la connexion
                if (isCurrent && err.status !== 401) setError(err.message);
            })
            .finally(() => {
                if (isCurrent) setIsLoading(false);
            });
        return () => { isCurrent = false; };
    }, [token, reloadCount]);

    const reloadTransactions = () => {
        setIsLoading(true);
        setError('');
        setReloadCount((count) => count + 1);
    };

    // Le message de confirmation ne doit pas réapparaître si on recharge la page
    useEffect(() => {
        if (location.state?.notice) navigate(location.pathname, { replace: true, state: null });
    }, [location, navigate]);

    // Appelée par le modal : si elle lance une erreur, le modal l'affiche
    const handleCreate = async (newTransaction) => {
        const created = await createTransaction(token, newTransaction);
        // Même tri que l'API : date la plus récente en haut
        setTransactions((current) =>
            [created, ...current].sort((a, b) => b.date.localeCompare(a.date))
        );
        setIsModalOpen(false);
        setNotice(`« ${created.label} » a été ajoutée.`);
    };

    const totals = computeTotals(transactions);

    return (
        <div className="transactions-page">
            <div className="page-header">
                <h1>Transactions</h1>
                <button className="button button-primary" onClick={() => { setNotice(''); setIsModalOpen(true); }}>
                    + Ajouter une transaction
                </button>
            </div>

            <InfoMessage message={notice} />

            {!isLoading && !error && transactions.length > 0 && (
                <section className="summary" aria-label="Résumé">
                    <div className="summary-card">
                        <span className="summary-label">Revenus</span>
                        <span className="summary-value income">{formatCents(totals.income)}</span>
                    </div>
                    <div className="summary-card">
                        <span className="summary-label">Dépenses</span>
                        <span className="summary-value expense">{formatCents(totals.expense)}</span>
                    </div>
                    <div className="summary-card">
                        <span className="summary-label">Solde</span>
                        <span className={`summary-value ${totals.balance < 0 ? 'expense' : 'income'}`}>
                            {totals.balance < 0 ? '−' : ''}{formatCents(Math.abs(totals.balance))}
                        </span>
                    </div>
                </section>
            )}

            {isLoading ? (
                <p className="empty-state" aria-live="polite">Chargement de vos transactions…</p>
            ) : error ? (
                <div className="error-state">
                    <ErrorMessage message={error} />
                    <button className="button button-secondary" onClick={reloadTransactions}>Réessayer</button>
                </div>
            ) : transactions.length === 0 ? (
                <div className="empty-state">
                    <p><strong>Aucune transaction pour le moment.</strong></p>
                    <p>Ajoutez votre première dépense ou votre premier revenu pour commencer à suivre votre budget.</p>
                    <button className="button button-primary" onClick={() => setIsModalOpen(true)}>
                        + Ajouter une transaction
                    </button>
                </div>
            ) : (
                <div className="table-wrapper">
                    <table className="transactions-table">
                        <thead>
                            <tr>
                                <th scope="col">Date</th>
                                <th scope="col">Libellé</th>
                                <th scope="col">Description</th>
                                <th scope="col">Type</th>
                                <th scope="col" className="amount">Montant</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((transaction) => (
                                <tr key={transaction.id}>
                                    <td>{formatDate(transaction.date)}</td>
                                    <td className="label">
                                        {/* Le lien couvre toute la ligne (voir .row-link dans le CSS) */}
                                        <Link to={`/transactions/${transaction.id}`} className="row-link">
                                            {transaction.label}
                                        </Link>
                                    </td>
                                    <td className="muted">{transaction.description || '—'}</td>
                                    <td>
                                        <span className={`badge ${transaction.type}`}>
                                            {transaction.type === 'income' ? 'Revenu' : 'Dépense'}
                                        </span>
                                    </td>
                                    <td className={`amount ${transaction.type}`}>
                                        {transaction.type === 'income' ? '+' : '−'}
                                        {formatCents(transaction.amount)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <TransactionModal onClose={() => setIsModalOpen(false)} onSubmit={handleCreate} />
            )}
        </div>
    )
}
