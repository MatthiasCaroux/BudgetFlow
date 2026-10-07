import { useEffect } from 'react';

// Titre de l'onglet du navigateur, propre à chaque page
export function usePageTitle(title) {
    useEffect(() => {
        document.title = title ? `${title} · BudgetFlow` : 'BudgetFlow';
    }, [title]);
}
