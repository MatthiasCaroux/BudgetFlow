import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Pages réservées aux utilisateurs connectés.
// Sinon : redirection vers /login, en retenant la page demandée pour y revenir après.
// C'est du confort d'affichage : la vraie protection est requireAuth côté API.
export default function ProtectedRoute({ children }) {
    const { isAuthenticated, logoutReason } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location, reason: logoutReason }} />;
    }
    return children;
}
