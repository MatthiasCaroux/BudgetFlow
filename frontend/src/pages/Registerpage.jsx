import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ErrorMessage from '../components/ErrorMessage.jsx'
import { useAuth } from '../context/AuthContext.jsx'

function Registerpage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    setError('')
    setLoading(true)
    try {
      // L'inscription renvoie déjà un token : l'utilisateur est connecté directement
      await register(email, password)
      navigate('/transactions')
    } catch (err) {
      // Message renvoyé par l'API (ex : 409 "Cet email est déjà utilisé")
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-card">
      <h1>Créer un compte</h1>
      <p className="auth-subtitle">Inscrivez-vous gratuitement et commencez à suivre vos dépenses.</p>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            placeholder="vous@exemple.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Mot de passe
          <input
            type="password"
            placeholder="8 caractères minimum"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <label>
          Confirmer le mot de passe
          <input
            type="password"
            placeholder="Retapez votre mot de passe"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </label>
        <ErrorMessage message={error} />
        <button type="submit" className="button button-primary" disabled={loading}>
          {loading ? 'Création…' : 'Créer mon compte'}
        </button>
      </form>
      <p className="auth-switch">
        Déjà un compte ? <Link to="/login">Se connecter</Link>
      </p>
    </div>
  )
}

export default Registerpage
