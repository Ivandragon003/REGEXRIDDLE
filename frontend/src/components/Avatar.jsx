import { resolveAssetUrl } from '../api'

// Mostra l'immagine avatar se presente, altrimenti l'iniziale dello username.
export default function Avatar({ username, avatarUrl, size = 36 }) {
  const dimension = { width: size, height: size, fontSize: size * 0.45 }
  const src = resolveAssetUrl(avatarUrl)

  if (src) {
    return (
      <img
        src={src}
        alt={username ? `Avatar di ${username}` : 'Avatar'}
        style={{ ...dimension, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      style={{
        ...dimension,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        color: 'var(--accent)',
        fontFamily: 'var(--font-mono)',
        fontWeight: 700,
      }}
    >
      {(username || '?').charAt(0).toUpperCase()}
    </span>
  )
}
