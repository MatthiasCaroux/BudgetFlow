import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import Registerpage from './pages/Registerpage.jsx';
import Transaction from './pages/Transaction.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/transactions" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Registerpage />} />
        <Route path="/transactions" element={<ProtectedRoute><Transaction /></ProtectedRoute>} />
      </Routes>
    </Layout>
  );
}
