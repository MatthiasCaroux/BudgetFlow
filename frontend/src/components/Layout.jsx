import Footer from './Footer.jsx';
import NavBar from './NavBar.jsx';

export default function Layout({ children }) {
  return (
    <div className="layout">
      <NavBar />
      <main className="content">{children}</main>
      <Footer />
    </div>
  );
}
