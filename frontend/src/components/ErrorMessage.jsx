// role="alert" : les lecteurs d'écran annoncent l'erreur dès qu'elle apparaît
export default function ErrorMessage({ message }) {
    if(!message) return null;
    
    return (
        <p className="error-message" role="alert">{message}</p>
    );
}
