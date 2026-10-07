import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import TransactionModal from '../components/TransactionModal.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

const currency = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const dateFormat = new Intl.DateTimeFormat('fr-FR');

// Les routes /api/transactions sont protégées : on envoie le token JWT
function authHeaders() {
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
    };
}

export default function Transaction() {
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isUnauthorized, setIsUnauthorized] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Charger la liste au premier affichage de la page
    useEffect(() => {
        async function loadTransactions() {
            try {
                const response = await fetch('/api/transactions', { headers: authHeaders() });
                if (response.status === 401) {
                    // 401 == Unauthorized
                    setIsUnauthorized(true);
                    return;
                }
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Erreur lors du chargement');
                setTransactions(data.transactions);
            } catch (err) {
                setError(err.message === 'Failed to fetch' ? 'Impossible de contacter le serveur' : err.message);
            } finally {
                setIsLoading(false);
            }
        }
        loadTransactions();
    }, []);

    // Appelée par le modal : si elle lance une erreur, le modal l'affiche
    const handleCreate = async (newTransaction) => {
        const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(newTransaction),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || data.message || 'Erreur lors de l’ajout');

        // On ajoute la transaction à la liste puis on retrie par date (la plus récente en haut)
        setTransactions((current) =>
            [data.transaction, ...current].sort((a, b) => new Date(b.date) - new Date(a.date))
        );
        setIsModalOpen(false);
    };

    return (
        <div className="transactions-page">
            <div className="page-header">
                <h1>Transactions</h1>
                {!isUnauthorized && (
                    <button className="button button-primary" onClick={() => setIsModalOpen(true)}>
                        + Ajouter une transaction
                    </button>
                )}
            </div>

            {isUnauthorized ? (
                <div className="empty-state">
                    <p>Vous devez être connecté pour voir vos transactions.</p>
                    <Link to="/login" className="button button-primary">Se connecter</Link>
                </div>
            ) : isLoading ? (
                <p className="empty-state">Chargement…</p>
            ) : error ? (
                <ErrorMessage message={error} />
            ) : transactions.length === 0 ? (
                <div className="empty-state">
                    <p>Aucune transaction pour le moment.</p>
                    <p>Cliquez sur « Ajouter une transaction » pour commencer.</p>
                </div>
            ) : (
                <div className="table-wrapper">
                    <table className="transactions-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Libellé</th>
                                <th>Description</th>
                                <th>Type</th>
                                <th className="amount">Montant</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((transaction) => (
                                <tr key={transaction._id}>
                                    <td>{dateFormat.format(new Date(transaction.date))}</td>
                                    <td className="label">{transaction.label}</td>
                                    <td className="muted">{transaction.description}</td>
                                    <td>
                                        <span className={`badge ${transaction.type}`}>
                                            {transaction.type === 'income' ? 'Revenu' : 'Dépense'}
                                        </span>
                                    </td>
                                    <td className={`amount ${transaction.type}`}>
                                        {transaction.type === 'income' ? '+' : '−'}
                                        {currency.format(transaction.amount)}
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
