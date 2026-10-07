import { Link, NavLink } from 'react-router-dom';

export default function NavBar() {
  return (
    <header className="navbar">
      <Link to="/transactions" className="navbar-brand">
        BudgetFlow
      </Link>
      <nav>
        <ul className="navbar-links">
          <li><NavLink to="/transactions">Transactions</NavLink></li>
          <li><NavLink to="/login">Se connecter</NavLink></li>
          <li><NavLink to="/register" className="navbar-cta">S'inscrire</NavLink></li>
        </ul>
      </nav>
    </header>
  );
}
