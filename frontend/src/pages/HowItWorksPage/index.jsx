import { useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './HowItWorksPage.module.css'

const DEMO_REGEX = '^[a-z]+$'

const steps = [
  {
    n: 1,
    title: 'L\'autore crea la sfida',
    text: 'Sceglie una regex segreta e fornisce un esempio che la soddisfa e uno che non la soddisfa. Aggiunge fino a 10 stringhe di controllo positive e 10 negative, che restano nascoste.',
  },
  {
    n: 2,
    title: 'Tu proponi una regex',
    text: 'Non vedi la regex segreta: la devi dedurre dagli esempi pubblici. Inserisci la tua proposta e inviala.',
  },
  {
    n: 3,
    title: 'Il sistema confronta i comportamenti',
    text: 'La tua regex viene testata sulle stringhe di controllo segrete. Vedi quante positive soddisfi e quante negative escludi correttamente.',
  },
  {
    n: 4,
    title: 'Risolvi e scala la classifica',
    text: 'La sfida è risolta quando la tua regex si comporta come l\'originale su tutte le stringhe di controllo. Meno tentativi usi, meglio ti posizioni.',
  },
]

export default function HowItWorksPage() {
  const [input, setInput] = useState('')

  let matches = null
  if (input) {
    try {
      matches = new RegExp(DEMO_REGEX).test(input)
    } catch {
      matches = null
    }
  }

  return (
    <main className="page">
      <div className="container">
        <header className="page-header">
          <h1 className="page-title">Come funziona</h1>
          <p className="page-subtitle">
            RegexRiddle è un gioco di deduzione: indovina il pattern segreto osservandone il
            comportamento.
          </p>
        </header>

        <section className={styles.steps}>
          {steps.map((s) => (
            <div key={s.n} className={`card ${styles.step}`}>
              <span className={styles.stepNumber}>{s.n}</span>
              <div>
                <h3>{s.title}</h3>
                <p className="muted">{s.text}</p>
              </div>
            </div>
          ))}
        </section>

        <section className={`card ${styles.demo}`}>
          <h2>Esempio interattivo</h2>
          <p className="muted">
            Regex di esempio: <code className="accent">{DEMO_REGEX}</code> (solo lettere minuscole)
          </p>

          <div className={styles.examples}>
            <span className="badge badge-success">✓ Soddisfa: <code>hello</code></span>
            <span className="badge badge-danger">✗ Non soddisfa: <code>Hello123</code></span>
          </div>

          <label className="label" htmlFor="demo-input">
            Prova tu: scrivi una stringa e guarda se soddisfa la regex
          </label>
          <input
            id="demo-input"
            className="input mono"
            placeholder="scrivi qui..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          {input && (
            <p className={styles.demoResult}>
              {matches ? (
                <span className="badge badge-success">✓ &quot;{input}&quot; soddisfa la regex</span>
              ) : (
                <span className="badge badge-danger">✗ &quot;{input}&quot; non soddisfa la regex</span>
              )}
            </p>
          )}
        </section>

        <section className={`card ${styles.scoring}`}>
          <h2>Le stringhe di controllo</h2>
          <p className="muted">
            Sono l&apos;elemento chiave: stringhe segrete che l&apos;autore sa essere positive
            (devono soddisfare la regex) o negative (non devono soddisfarla). Dopo ogni tentativo
            vedi due contatori:
          </p>
          <ul className={styles.list}>
            <li>
              <strong className="accent">Positive soddisfatte</strong> — quante stringhe positive la
              tua regex riconosce correttamente.
            </li>
            <li>
              <strong className="accent">Negative escluse</strong> — quante stringhe negative la tua
              regex correttamente rifiuta.
            </li>
          </ul>
          <p className="muted">
            Quando entrambi i contatori sono al massimo, la sfida è risolta.
          </p>
          <Link to="/sfide" className="btn btn-primary">
            Inizia a giocare
          </Link>
        </section>
      </div>
    </main>
  )
}
