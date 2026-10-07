import { Link } from 'react-router-dom';

export default function NavBar() {
  return (
    <>
      <header className="header">
          <p>Full Stack JS</p>
      </header>
      <nav className="navbar">
          <ul>
              <li><Link to="/">Accueil</Link></li>
              <li><Link to="/register">S'inscrire</Link></li>
              <li><Link to="/login">Se connecter</Link></li>
          </ul>
      </nav>
    </>
  );
}
