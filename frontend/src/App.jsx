import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import GuestRoute from './components/GuestRoute.jsx';
import { useAuth } from './context/AuthContext.jsx';
import Home from './pages/Home.jsx';
import LoginPage from './pages/LoginPage.jsx';
import Registerpage from './pages/Registerpage.jsx';
import Transaction from './pages/Transaction.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

// Accueil : les visiteurs voient la présentation, les connectés vont à leurs transactions
function HomeRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/transactions" replace /> : <Home />;
}

export default function App() {
  return (
    <Layout>
      <Routes>
        {/* Pages publiques */}
        <Route path="/" element={<HomeRoute />} />

        {/* Pages réservées aux visiteurs non connectés */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Registerpage /></GuestRoute>} />

        {/* Pages réservées aux utilisateurs connectés */}
        <Route path="/transactions" element={<ProtectedRoute><Transaction /></ProtectedRoute>} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}
