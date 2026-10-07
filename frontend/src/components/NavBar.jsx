import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="navbar">
      <Link to="/transactions" className="navbar-brand">
        BudgetFlow
      </Link>
      <nav>
        <ul className="navbar-links">
          {user ? (
            <>
              <li><NavLink to="/transactions">Transactions</NavLink></li>
              <li className="navbar-user">{user.email}</li>
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
