import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authAPI, errorMessage } from '../../api'
import { useAuth } from '../../hooks/useAuth'
import styles from '../../components/Auth.module.css'

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm()

  const password = watch('password')

  const onSubmit = async (data) => {
    setServerError('')
    try {
      const res = await authAPI.register({
        username: data.username,
        email: data.email,
        password: data.password,
      })
      login(res.token, { userId: res.userId, username: res.username })
      navigate('/', { replace: true })
    } catch (err) {
      setServerError(errorMessage(err, 'Registrazione non riuscita'))
    }
  }

  return (
    <main className={styles.wrap}>
      <form className={styles.card} onSubmit={handleSubmit(onSubmit)} noValidate>
        <p className={styles.kicker}>// crea un account</p>
        <h1 className={styles.title}>Registrati</h1>

        {serverError && (
          <div className="alert alert-error" role="alert" style={{ marginBottom: '1rem' }}>
            {serverError}
          </div>
        )}

        <div className="field">
          <label className="label" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            className={`input ${errors.username ? 'has-error' : ''}`}
            aria-invalid={!!errors.username}
            aria-describedby={errors.username ? 'username-error' : undefined}
            {...register('username', {
              required: 'Lo username è obbligatorio',
              minLength: { value: 3, message: 'Minimo 3 caratteri' },
              maxLength: { value: 30, message: 'Massimo 30 caratteri' },
            })}
          />
          {errors.username && (
            <span id="username-error" className="field-error">
              {errors.username.message}
            </span>
          )}
        </div>

        <div className="field">
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className={`input ${errors.email ? 'has-error' : ''}`}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email', {
              required: 'L\'email è obbligatoria',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email non valida' },
            })}
          />
          {errors.email && (
            <span id="email-error" className="field-error">
              {errors.email.message}
            </span>
          )}
        </div>

        <div className="field">
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className={`input ${errors.password ? 'has-error' : ''}`}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...register('password', {
              required: 'La password è obbligatoria',
              minLength: { value: 6, message: 'Minimo 6 caratteri' },
            })}
          />
          {errors.password && (
            <span id="password-error" className="field-error">
              {errors.password.message}
            </span>
          )}
        </div>

        <div className="field">
          <label className="label" htmlFor="confirmPassword">
            Conferma password
          </label>
          <input
            id="confirmPassword"
            type="password"
            className={`input ${errors.confirmPassword ? 'has-error' : ''}`}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
            {...register('confirmPassword', {
              required: 'Conferma la password',
              validate: (value) => value === password || 'Le password non coincidono',
            })}
          />
          {errors.confirmPassword && (
            <span id="confirm-error" className="field-error">
              {errors.confirmPassword.message}
            </span>
          )}
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
          {isSubmitting ? 'Creazione...' : 'Crea account'}
        </button>

        <p className={styles.switch}>
          Hai già un account? <Link to="/login">Accedi</Link>
        </p>
      </form>
    </main>
  )
}
