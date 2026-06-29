import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { challengesAPI } from '../../api'
import { useAuth } from '../../hooks/useAuth'
import ChallengeCard from '../../components/ChallengeCard'
import styles from './ChallengesListPage.module.css'

const SORTS = {
  recent: { label: 'Più recenti', fn: (a, b) => new Date(b.createdAt) - new Date(a.createdAt) },
  attempts: { label: 'Più tentate', fn: (a, b) => b.totalAttempts - a.totalAttempts },
  solved: { label: 'Più risolte', fn: (a, b) => b.solvedByCount - a.solvedByCount },
}

export default function ChallengesListPage() {
  const { isAuthenticated, user } = useAuth()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('recent')
  const [onlyMine, setOnlyMine] = useState(false)
  const [hideSolved, setHideSolved] = useState(false)

  const { data: challenges, isLoading, isError } = useQuery({
    queryKey: ['challenges'],
    queryFn: challengesAPI.getAll,
  })

  // Id delle sfide già risolte dall'utente (solo se autenticato).
  const { data: solvedIds = [] } = useQuery({
    queryKey: ['solved-challenges'],
    queryFn: challengesAPI.getSolved,
    enabled: isAuthenticated,
  })

  const filtered = useMemo(() => {
    if (!challenges) return []
    const q = search.trim().toLowerCase()
    const solvedSet = new Set(solvedIds)
    let result = challenges.filter((c) => {
      if (q && !c.title.toLowerCase().includes(q)) return false
      if (onlyMine && c.authorUsername !== user?.username) return false
      if (hideSolved && solvedSet.has(c.id)) return false
      return true
    })
    result = [...result].sort(SORTS[sort].fn)
    return result
  }, [challenges, search, sort, onlyMine, hideSolved, solvedIds, user])

  return (
    <main className="page">
      <div className="container">
        <header className={`page-header ${styles.header}`}>
          <div>
            <h1 className="page-title">Sfide</h1>
            <p className="page-subtitle">Scegli un enigma e prova a indovinare la regex segreta.</p>
          </div>
          {isAuthenticated && (
            <Link to="/sfide/nuova" className="btn btn-primary">
              + Nuova sfida
            </Link>
          )}
        </header>

        <div className={styles.toolbar}>
          <input
            className="input"
            type="search"
            placeholder="Cerca per titolo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Cerca sfide per titolo"
          />

          <label className={styles.sortField}>
            <span className="muted">Ordina:</span>
            <select
              className="input"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Ordina le sfide"
            >
              {Object.entries(SORTS).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {isAuthenticated && (
          <div className={styles.chips}>
            <button
              type="button"
              className={`${styles.chip} ${onlyMine ? styles.chipActive : ''}`}
              onClick={() => setOnlyMine((v) => !v)}
              aria-pressed={onlyMine}
            >
              Solo le mie
            </button>
            <button
              type="button"
              className={`${styles.chip} ${hideSolved ? styles.chipActive : ''}`}
              onClick={() => setHideSolved((v) => !v)}
              aria-pressed={hideSolved}
            >
              Nascondi già risolte
            </button>
          </div>
        )}

        {isLoading && (
          <div className={styles.center}>
            <div className="spinner" />
          </div>
        )}

        {isError && (
          <div className="alert alert-error">Impossibile caricare le sfide. Riprova più tardi.</div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className={`alert alert-info ${styles.empty}`}>
            {challenges && challenges.length > 0
              ? 'Nessuna sfida corrisponde ai filtri selezionati.'
              : 'Ancora nessuna sfida pubblicata. Sii il primo a crearne una!'}
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div className={styles.grid}>
            {filtered.map((c) => (
              <ChallengeCard key={c.id} challenge={c} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
