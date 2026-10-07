import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Pages réservées aux visiteurs (connexion, inscription) :
// une personne déjà connectée est renvoyée vers la page qu'elle voulait, ou ses transactions.
export default function GuestRoute({ children }) {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    if (isAuthenticated) {
        const destination = location.state?.from?.pathname ?? '/transactions';
        return <Navigate to={destination} replace />;
    }
    return children;
}
