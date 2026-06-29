import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { challengesAPI, errorMessage } from '../../api'
import { useAuth } from '../../hooks/useAuth'
import styles from './ChallengeDetailPage.module.css'

function ProgressRow({ label, value, total }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className={styles.progressRow}>
      <div className="row between" style={{ marginBottom: '0.35rem' }}>
        <span className={styles.progressLabel}>{label}</span>
        <span className="mono accent">
          {value}/{total}
        </span>
      </div>
      <div className="progress">
        <div className="progress-bar success" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function formatDateTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ChallengeDetailPage() {
  const { id } = useParams()
  const { isAuthenticated, user } = useAuth()
  const queryClient = useQueryClient()
  const [regex, setRegex] = useState('')
  const [clientError, setClientError] = useState('')

  const { data: challenge, isLoading, isError } = useQuery({
    queryKey: ['challenge', id],
    queryFn: () => challengesAPI.getById(id),
  })

  const { data: attempts } = useQuery({
    queryKey: ['attempts', id],
    queryFn: () => challengesAPI.getAttempts(id),
    enabled: isAuthenticated,
  })

  const mutation = useMutation({
    mutationFn: (value) => challengesAPI.attempt(id, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attempts', id] })
      queryClient.invalidateQueries({ queryKey: ['challenge', id] })
      queryClient.invalidateQueries({ queryKey: ['challenges'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
      queryClient.invalidateQueries({ queryKey: ['me'] })
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setClientError('')
    if (!regex.trim()) {
      setClientError('Inserisci una regex')
      return
    }
    // Validazione sintattica lato client per UX (il server ricontrolla comunque).
    try {
      new RegExp(regex)
    } catch {
      setClientError('La regex non è sintatticamente valida')
      return
    }
    mutation.mutate(regex)
  }

  if (isLoading) {
    return (
      <main className="page">
        <div className="container" style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="spinner" />
        </div>
      </main>
    )
  }

  if (isError || !challenge) {
    return (
      <main className="page">
        <div className="container">
          <div className="alert alert-error">Sfida non trovata.</div>
          <Link to="/sfide" className="btn btn-ghost" style={{ marginTop: '1rem' }}>
            ← Torna alle sfide
          </Link>
        </div>
      </main>
    )
  }

  const result = mutation.data
  const serverError = mutation.isError ? errorMessage(mutation.error) : ''
  const isOwner = isAuthenticated && user?.username === challenge.authorUsername

  return (
    <main className="page">
      <div className="container">
        <Link to="/sfide" className={styles.back}>
          ← Tutte le sfide
        </Link>

        <header className={styles.header}>
          <h1 className="page-title">{challenge.title}</h1>
          <p className="muted">
            di <strong className="accent">{challenge.authorUsername}</strong> · {challenge.solvedByCount}{' '}
            risolta · {challenge.totalAttempts} tentativi
          </p>
          {challenge.description && <p>{challenge.description}</p>}
        </header>

        <section className={`card ${styles.examples}`}>
          <h2>Esempi</h2>
          <div className={styles.exampleRow}>
            <span className="badge badge-success">✓ Soddisfa la regex</span>
            <code className={styles.exampleValue}>{challenge.exampleMatch}</code>
          </div>
          <div className={styles.exampleRow}>
            <span className="badge badge-danger">✗ Non soddisfa la regex</span>
            <code className={styles.exampleValue}>{challenge.exampleNoMatch}</code>
          </div>
        </section>

        {!isAuthenticated ? (
          <section className={`alert alert-info ${styles.banner}`}>
            <span>Accedi per partecipare alla sfida.</span>
            <Link to="/login" state={{ from: `/sfide/${id}` }} className="btn btn-primary btn-sm">
              Accedi
            </Link>
          </section>
        ) : isOwner ? (
          <section className={`card ${styles.ownerCard}`}>
            <div className={styles.ownerBadge}>👑 Sei l&apos;autore di questa sfida</div>
            <p className="muted">
              Non puoi tentare una sfida creata da te. Qui vedi come sta andando tra gli altri
              giocatori.
            </p>
            <div className={styles.ownerStats}>
              <div className={styles.ownerStat}>
                <span className={styles.ownerStatValue}>{challenge.solvedByCount}</span>
                <span className="muted">l&apos;hanno risolta</span>
              </div>
              <div className={styles.ownerStat}>
                <span className={styles.ownerStatValue}>{challenge.totalAttempts}</span>
                <span className="muted">tentativi totali</span>
              </div>
            </div>
          </section>
        ) : (
          <section className={`card ${styles.attemptCard}`}>
            <h2>Il tuo tentativo</h2>
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label className="label" htmlFor="regex">
                  Proponi una regex
                </label>
                <input
                  id="regex"
                  className={`input mono ${clientError || serverError ? 'has-error' : ''}`}
                  placeholder="^...$"
                  value={regex}
                  onChange={(e) => setRegex(e.target.value)}
                  aria-invalid={!!(clientError || serverError)}
                  aria-describedby={clientError ? 'regex-error' : undefined}
                />
                {clientError && (
                  <span id="regex-error" className="field-error">
                    {clientError}
                  </span>
                )}
              </div>
              <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
                {mutation.isPending ? 'Verifica...' : 'Verifica'}
              </button>
            </form>

            {serverError && (
              <div className="alert alert-error" style={{ marginTop: '1rem' }}>
                {serverError}
              </div>
            )}

            {result && (
              <div className={`${styles.result} ${result.solved ? styles.solved : ''}`}>
                {result.solved ? (
                  <div className={styles.successBanner}>
                    🎉 <strong>Sfida risolta!</strong> La tua regex si comporta esattamente come
                    l&apos;originale.
                  </div>
                ) : (
                  <p className="muted">Non ancora: continua a perfezionare la regex.</p>
                )}
                <ProgressRow
                  label="Stringhe positive soddisfatte"
                  value={result.positiveMatched}
                  total={result.totalPositive}
                />
                <ProgressRow
                  label="Stringhe negative correttamente escluse"
                  value={result.negativeMatched}
                  total={result.totalNegative}
                />
              </div>
            )}

            {attempts && attempts.length > 0 && (
              <div className={styles.history}>
                <h3>I tuoi tentativi</h3>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Quando</th>
                        <th>Regex</th>
                        <th>Pos.</th>
                        <th>Neg.</th>
                        <th>Esito</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attempts.map((a, i) => (
                        <tr key={i}>
                          <td className="muted">{formatDateTime(a.attemptedAt)}</td>
                          <td>
                            <code>{a.proposedRegex}</code>
                          </td>
                          <td className="mono">
                            {a.positiveMatched}/{a.totalPositive}
                          </td>
                          <td className="mono">
                            {a.negativeMatched}/{a.totalNegative}
                          </td>
                          <td>
                            {a.solved ? (
                              <span className="accent">✓ risolta</span>
                            ) : (
                              <span className="muted">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  )
}
