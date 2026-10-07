import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true, state: { reason: 'logout' } });
  }

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">
        BudgetFlow
      </Link>
      <nav aria-label="Navigation principale">
        <ul className="navbar-links">
          {user ? (
            <>
              <li><NavLink to="/transactions">Transactions</NavLink></li>
              <li className="navbar-user" title={user.email}>
                <span className="navbar-avatar" aria-hidden="true">{user.email[0].toUpperCase()}</span>
                <span className="navbar-email">{user.email}</span>
              </li>
              <li>
                <button type="button" className="navbar-logout" onClick={handleLogout}>
                  Se déconnecter
                </button>
              </li>
            </>
          ) : (
            <>
              <li><NavLink to="/login">Se connecter</NavLink></li>
              <li><NavLink to="/register" className="navbar-cta">S'inscrire</NavLink></li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
}
