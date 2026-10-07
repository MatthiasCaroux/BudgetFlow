import Header from './Header.jsx';
import Footer from './Footer.jsx';

export default function Layout({ children }) {
  return (
    <div className="layout">
      <a className="skip-link" href="#contenu">Aller au contenu</a>
      <Header />
      <main id="contenu" className="content container" tabIndex="-1">{children}</main>
      <Footer />
    </div>
  );
}
