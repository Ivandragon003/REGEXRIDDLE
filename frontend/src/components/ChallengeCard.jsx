import { Link } from 'react-router-dom'
import styles from './ChallengeCard.module.css'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function ChallengeCard({ challenge }) {
  return (
    <Link to={`/sfide/${challenge.id}`} className={`card card-hover ${styles.card}`}>
      <div className={styles.head}>
        <span className={styles.tag}>/regex/</span>
        <span className="muted" style={{ fontSize: '0.8rem' }}>
          {formatDate(challenge.createdAt)}
        </span>
      </div>
      <h3 className={styles.title}>{challenge.title}</h3>
      {challenge.description && <p className={styles.desc}>{challenge.description}</p>}
      <div className={styles.meta}>
        <span className="muted">
          di <strong className="accent">{challenge.authorUsername}</strong>
        </span>
      </div>
      <div className={styles.stats}>
        <span>🎯 {challenge.totalAttempts} tentativi</span>
        <span>✅ {challenge.solvedByCount} risolta</span>
      </div>
    </Link>
  )
}
