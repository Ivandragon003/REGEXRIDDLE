import { useQuery } from '@tanstack/react-query'
import { leaderboardAPI } from '../../api'
import { useAuth } from '../../hooks/useAuth'
import Avatar from '../../components/Avatar'
import styles from './LeaderboardPage.module.css'

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default function LeaderboardPage() {
  const { user } = useAuth()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: leaderboardAPI.get,
  })

  return (
    <main className="page">
      <div className="container">
        <header className="page-header">
          <h1 className="page-title">Classifica</h1>
          <p className="page-subtitle">
            Ordinata per sfide risolte e, a parità, per minor numero medio di tentativi.
          </p>
        </header>

        {isLoading && (
          <div className={styles.skeletonWrap}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.skeleton} />
            ))}
          </div>
        )}

        {isError && <div className="alert alert-error">Impossibile caricare la classifica.</div>}

        {!isLoading && !isError && data && data.length === 0 && (
          <div className="alert alert-info text-center">
            Ancora nessuno in classifica. Risolvi una sfida per primo!
          </div>
        )}

        {!isLoading && !isError && data && data.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Utente</th>
                  <th className={styles.num}>Risolte</th>
                  <th className={styles.num}>Media tentativi</th>
                </tr>
              </thead>
              <tbody>
                {data.map((entry) => {
                  const isMe = user?.username === entry.username
                  return (
                    <tr key={entry.username} className={isMe ? styles.me : ''}>
                      <td className={styles.rank}>{MEDALS[entry.rank] || entry.rank}</td>
                      <td>
                        <div className={styles.userCell}>
                          <Avatar username={entry.username} avatarUrl={entry.avatarUrl} size={32} />
                          <span>
                            {entry.username}
                            {isMe && <span className={styles.youTag}>tu</span>}
                          </span>
                        </div>
                      </td>
                      <td className={`${styles.num} mono`}>{entry.solvedCount}</td>
                      <td className={`${styles.num} mono`}>{entry.avgAttempts.toFixed(1)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
