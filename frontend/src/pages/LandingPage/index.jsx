import { Link } from 'react-router-dom'
import styles from './LandingPage.module.css'

const features = [
  {
    icon: '+',
    title: 'Crea',
    text: 'Definisci una regex segreta, due esempi pubblici e le stringhe di controllo nascoste.',
  },
  {
    icon: '/',
    title: 'Risolvi',
    text: 'Proponi la tua regex e scopri quante stringhe di controllo soddisfi ad ogni tentativo.',
  },
  {
    icon: '#',
    title: 'Scala la classifica',
    text: 'Più sfide risolvi e meno tentativi usi, più sali nella classifica globale.',
  },
]

export default function LandingPage() {
  return (
    <main className="page">
      <section className={`container ${styles.hero}`}>
        <p className={styles.kicker}>// WebTech's RegexRiddle</p>
        <h1 className={styles.title}>
          Indovina la <span className="accent">regex</span>
          <span className="cursor-blink" />
        </h1>
        <p className={styles.subtitle}>
          Sfida i tuoi colleghi. Crea enigmi basati su espressioni regolari e mettiti alla prova
          per scoprire il pattern segreto.
        </p>
        <div className={styles.ctas}>
          <Link to="/sfide" className="btn btn-primary">
            Esplora le sfide
          </Link>
          <Link to="/come-funziona" className="btn btn-ghost">
            Come funziona
          </Link>
        </div>

        <pre className={styles.terminal} aria-hidden="true">
{`$ regexriddle solve --challenge "email"
> tentativo: ^[\\w.-]+@[\\w.-]+\\.[a-z]+$
  positive: 2/2  ✓
  negative: 3/3  ✓
> sfida risolta in 3 tentativi 🎉`}
        </pre>
      </section>

      <section className={`container ${styles.featuresWrap}`}>
        <div className={styles.features}>
          {features.map((f) => (
            <div key={f.title} className={`card card-hover ${styles.feature}`}>
              <span className={styles.featureIcon}>{f.icon}</span>
              <h3>{f.title}</h3>
              <p className="muted">{f.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
