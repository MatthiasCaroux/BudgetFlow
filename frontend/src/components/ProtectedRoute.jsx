import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Redirige vers /login si personne n'est connecté.
// C'est du confort d'affichage : la vraie protection est requireAuth côté API.
export default function ProtectedRoute({ children }) {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return children;
}
