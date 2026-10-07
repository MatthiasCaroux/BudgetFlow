import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import ErrorMessage from '../components/ErrorMessage.jsx'
import PasswordInput from '../components/PasswordInput.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { usePageTitle } from '../hooks/usePageTitle.js'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

function Registerpage() {
  usePageTitle('Créer un compte')
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()

  const passwordLongEnough = password.length >= MIN_PASSWORD_LENGTH

  // Vérification rapide côté navigateur, pour aider l'utilisateur.
  // L'API refait toutes les vérifications : c'est elle qui protège les données.
  function validate() {
    const errors = {}
    if (!EMAIL_REGEX.test(email.trim())) errors.email = 'Saisissez une adresse email valide, par exemple vous@exemple.com.'
    if (!passwordLongEnough) errors.password = `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`
    if (confirmPassword !== password) errors.confirmPassword = 'Les deux mots de passe ne correspondent pas.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!validate()) return
    setLoading(true)
    try {
      // L'inscription renvoie déjà un token : l'utilisateur est connecté directement,
      // et GuestRoute le redirige vers ses transactions
      await register(email.trim(), password)
    } catch (err) {
      // 409 : on affiche l'erreur sous le champ email, avec une piste pour s'en sortir
      if (err.code === 'EMAIL_ALREADY_USED') {
        setFieldErrors({ email: 'Un compte existe déjà avec cet email. Connectez-vous plutôt.' })
      } else {
        setError(err.message)
      }
      setLoading(false)
    }
  }

  return (
    <div className="auth-card">
      <h1>Créer un compte</h1>
      <p className="auth-subtitle">Inscrivez-vous gratuitement et commencez à suivre vos dépenses.</p>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            placeholder="vous@exemple.com"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'register-email-error' : undefined}
          />
          {fieldErrors.email && <p id="register-email-error" className="field-error">{fieldErrors.email}</p>}
        </div>
        <div className="field">
          <label htmlFor="register-password">Mot de passe</label>
          <PasswordInput
            id="register-password"
            placeholder={`${MIN_PASSWORD_LENGTH} caractères minimum`}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby="register-password-hint"
          />
          {fieldErrors.password ? (
            <p id="register-password-hint" className="field-error">{fieldErrors.password}</p>
          ) : (
            <p id="register-password-hint" className={`field-hint ${passwordLongEnough ? 'valid' : ''}`}>
              {passwordLongEnough ? '✓ ' : ''}Au moins {MIN_PASSWORD_LENGTH} caractères
            </p>
          )}
        </div>
        <div className="field">
          <label htmlFor="register-confirm">Confirmer le mot de passe</label>
          <PasswordInput
            id="register-confirm"
            placeholder="Retapez votre mot de passe"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            aria-invalid={Boolean(fieldErrors.confirmPassword)}
            aria-describedby={fieldErrors.confirmPassword ? 'register-confirm-error' : undefined}
          />
          {fieldErrors.confirmPassword && <p id="register-confirm-error" className="field-error">{fieldErrors.confirmPassword}</p>}
        </div>
        <ErrorMessage message={error} />
        <button type="submit" className="button button-primary" disabled={loading}>
          {loading ? 'Création du compte…' : 'Créer mon compte'}
        </button>
      </form>
      <p className="auth-switch">
        Déjà un compte ? <Link to="/login" state={{ from: location.state?.from }}>Se connecter</Link>
      </p>
    </div>
  )
}

export default Registerpage
