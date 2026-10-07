import Footer from './Footer.jsx';
import NavBar from './NavBar.jsx';

export default function Layout({ children }) {
  return (
    <div className="layout">
      <a className="skip-link" href="#contenu">Aller au contenu</a>
      <NavBar />
      <main id="contenu" className="content" tabIndex="-1">{children}</main>
      <Footer />
    </div>
  );
}
