import React, { useState } from 'react'
import ErrorMessage from '../components/ErrorMessage.jsx'

function Registerpage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    setError('')
    console.log('Email:', email)
    console.log('Password:', password)
  }

  return (
    <div className="auth-container">
      <h1>Créer mon compte</h1>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Mot de passe
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <label>
          Confirmer le mot de passe
          <input
            type="password"
            placeholder="Confirmer le mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </label>
        <ErrorMessage message={error} />
        <button type="submit">Créer mon compte</button>
      </form>
    </div>
  )
}

export default Registerpage
