import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle.js';

const features = [
  {
    title: 'Enregistrez vos transactions',
    text: 'Ajoutez vos dépenses et vos revenus en quelques secondes, avec un montant, une date et un libellé.',
  },
  {
    title: 'Gardez un œil sur votre solde',
    text: 'Visualisez en un coup d’œil ce qui rentre, ce qui sort et ce qu’il vous reste.',
  },
  {
    title: 'Vos données restent privées',
    text: 'Chaque compte est protégé par un mot de passe chiffré : vous seul avez accès à vos transactions.',
  },
];

// Page d'accueil publique, affichée aux visiteurs non connectés
export default function Home() {
  usePageTitle(null);

  return (
    <div className="home">
      <section className="hero">
        <h1>Reprenez le contrôle de votre budget</h1>
        <p>
          BudgetFlow est une application simple pour enregistrer vos transactions
          et suivre où part votre argent, au jour le jour.
        </p>
        <div className="hero-actions">
          <Link to="/register" className="button button-primary">Créer un compte gratuit</Link>
          <Link to="/login" className="button button-secondary">J’ai déjà un compte</Link>
        </div>
      </section>

      <section className="features" aria-label="Fonctionnalités">
        {features.map((feature) => (
          <article key={feature.title} className="feature-card">
            <h2>{feature.title}</h2>
            <p>{feature.text}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
