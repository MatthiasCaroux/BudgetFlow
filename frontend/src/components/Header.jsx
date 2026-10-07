export default function Header() {
  return (
    <header className="header">
      <div className="container header-inner">
        <a className="brand" href="/">BudgetFlow</a>
        <nav aria-label="Navigation principale">
          <ul className="nav-list">
            <li>
              <a href="/" aria-current="page">Accueil</a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
