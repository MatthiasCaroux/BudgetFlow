import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function NotFoundPage() {
  usePageTitle('Page introuvable');
  const { isAuthenticated } = useAuth();

  return (
    <div className="not-found">
      <p className="not-found-code">404</p>
      <h1>Cette page n’existe pas</h1>
      <p>Le lien est peut-être incorrect, ou la page a été déplacée.</p>
      <Link to={isAuthenticated ? '/transactions' : '/'} className="button button-primary">
        {isAuthenticated ? 'Retour à mes transactions' : 'Retour à l’accueil'}
      </Link>
    </div>
  );
}
