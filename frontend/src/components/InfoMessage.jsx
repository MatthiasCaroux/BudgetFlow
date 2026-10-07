// Message neutre (ex : « Vous avez été déconnecté »), annoncé poliment aux lecteurs d'écran
export default function InfoMessage({ message }) {
    if (!message) return null;

    return (
        <p className="info-message" role="status">{message}</p>
    );
}
