import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { challengesAPI, errorMessage, userAPI } from '../../api'
import { useAuth } from '../../hooks/useAuth'
import Avatar from '../../components/Avatar'
import styles from './ProfilePage.module.css'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [feedback, setFeedback] = useState(null) // { type, text }
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: userAPI.getMe,
  })

  const { data: myChallenges } = useQuery({
    queryKey: ['my-challenges'],
    queryFn: challengesAPI.getMy,
  })

  useEffect(() => {
    if (profile) {
      setUsername(profile.username)
      setEmail(profile.email)
    }
  }, [profile])

  const handleSave = async (e) => {
    e.preventDefault()
    setFeedback(null)
    setSaving(true)
    try {
      const updated = await userAPI.updateMe({ username, email })
      updateUser({ username: updated.username })
      queryClient.invalidateQueries({ queryKey: ['me'] })
      setFeedback({ type: 'success', text: 'Profilo aggiornato con successo.' })
    } catch (err) {
      setFeedback({ type: 'error', text: errorMessage(err, 'Aggiornamento non riuscito') })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFeedback(null)
    setUploading(true)
    try {
      const res = await userAPI.uploadAvatar(file)
      updateUser({ avatarUrl: res.avatarUrl })
      queryClient.invalidateQueries({ queryKey: ['me'] })
      setFeedback({ type: 'success', text: 'Avatar aggiornato.' })
    } catch (err) {
      setFeedback({ type: 'error', text: errorMessage(err, 'Upload non riuscito') })
    } finally {
      setUploading(false)
    }
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

  const avatarUrl = profile?.avatarUrl

  return (
    <main className="page">
      <div className="container">
        <header className="page-header">
          <h1 className="page-title">Il tuo profilo</h1>
        </header>

        {feedback && (
          <div
            className={`alert ${feedback.type === 'error' ? 'alert-error' : 'alert-info'}`}
            style={{ marginBottom: '1.5rem', borderColor: feedback.type === 'success' ? 'var(--accent)' : undefined }}
            role="status"
          >
            {feedback.text}
          </div>
        )}

        <div className={styles.layout}>
          <section className="card">
            <h3>Dati account</h3>
            <button
              type="button"
              className={styles.avatarButton}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Cambia avatar"
            >
              <Avatar username={user?.username} avatarUrl={avatarUrl} size={88} />
              <span className={styles.avatarOverlay}>{uploading ? '...' : 'Cambia'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif"
              hidden
              onChange={handleAvatarChange}
            />

            <form onSubmit={handleSave} style={{ marginTop: '1.5rem' }}>
              <div className="field">
                <label className="label" htmlFor="username">
                  Username
                </label>
                <input
                  id="username"
                  className="input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Salvataggio...' : 'Salva modifiche'}
              </button>
            </form>
          </section>

          <div className="stack">
            <section className="card">
              <h3>Statistiche</h3>
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{profile?.createdChallengesCount ?? 0}</span>
                  <span className="muted">Sfide create</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{profile?.solvedCount ?? 0}</span>
                  <span className="muted">Sfide risolte</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{profile?.totalAttempts ?? 0}</span>
                  <span className="muted">Tentativi totali</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{(profile?.avgAttempts ?? 0).toFixed(1)}</span>
                  <span className="muted">Media tentativi</span>
                </div>
              </div>
            </section>

            <section className="card">
              <h3>Le tue sfide</h3>
              {myChallenges && myChallenges.length > 0 ? (
                <ul className={styles.challengeList}>
                  {myChallenges.map((c) => (
                    <li key={c.id}>
                      <Link to={`/sfide/${c.id}`} className={styles.challengeLink}>
                        <span>{c.title}</span>
                        <span className="muted mono" style={{ fontSize: '0.8rem' }}>
                          {c.solvedByCount} risolta
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">
                  Non hai ancora creato sfide.{' '}
                  <Link to="/sfide/nuova" className="accent">
                    Creane una
                  </Link>
                  .
                </p>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
