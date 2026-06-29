import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main className="page">
      <div className="container text-center" style={{ paddingTop: '4rem' }}>
        <h1 style={{ fontSize: '4rem', margin: 0 }} className="accent">
          404
        </h1>
        <p className="muted" style={{ marginBottom: '2rem' }}>
          <code>/pagina/non/trovata/</code> non corrisponde a nessuna route.
        </p>
        <Link to="/" className="btn btn-primary">
          Torna alla home
        </Link>
      </div>
    </main>
  )
}
