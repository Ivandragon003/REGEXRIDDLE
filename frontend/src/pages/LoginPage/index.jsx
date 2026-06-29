import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authAPI, errorMessage } from '../../api'
import { useAuth } from '../../hooks/useAuth'
import styles from '../../components/Auth.module.css'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm()

  const redirectTo = location.state?.from || '/'

  const onSubmit = async (data) => {
    setServerError('')
    try {
      const res = await authAPI.login(data)
      login(res.token, { userId: res.userId, username: res.username })
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setServerError(errorMessage(err, 'Credenziali non valide'))
    }
  }

  return (
    <main className={styles.wrap}>
      <form className={styles.card} onSubmit={handleSubmit(onSubmit)} noValidate>
        <p className={styles.kicker}>// accedi</p>
        <h1 className={styles.title}>Bentornato</h1>

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
            {...register('username', { required: 'Lo username è obbligatorio' })}
          />
          {errors.username && (
            <span id="username-error" className="field-error">
              {errors.username.message}
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
            {...register('password', { required: 'La password è obbligatoria' })}
          />
          {errors.password && (
            <span id="password-error" className="field-error">
              {errors.password.message}
            </span>
          )}
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
          {isSubmitting ? 'Accesso...' : 'Accedi'}
        </button>

        <p className={styles.switch}>
          Non hai un account? <Link to="/registrati">Registrati</Link>
        </p>
      </form>
    </main>
  )
}
