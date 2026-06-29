import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { challengesAPI, errorMessage } from '../../api'
import styles from './CreateChallengePage.module.css'

const MAX_CONTROL = 10

function compileRegex(pattern) {
  try {
    return new RegExp(pattern)
  } catch {
    return null
  }
}

// Lista dinamica di stringhe di controllo.
function ControlList({ title, hint, items, setItems, testRegex, shouldMatch }) {
  const add = () => {
    if (items.length < MAX_CONTROL) setItems([...items, ''])
  }
  const remove = (i) => setItems(items.filter((_, idx) => idx !== i))
  const update = (i, value) => setItems(items.map((v, idx) => (idx === i ? value : v)))

  return (
    <div className={styles.controlBlock}>
      <div className="row between">
        <h3>{title}</h3>
        <span className="muted" style={{ fontSize: '0.8rem' }}>
          {items.length}/{MAX_CONTROL}
        </span>
      </div>
      <p className="muted" style={{ fontSize: '0.85rem' }}>
        {hint}
      </p>
      {items.map((value, i) => {
        const re = testRegex
        let status = null
        if (re && value !== '') {
          const ok = re.test(value) === shouldMatch
          status = ok
        }
        return (
          <div key={i} className={styles.controlItem}>
            <input
              className={`input mono ${status === false ? 'has-error' : ''}`}
              value={value}
              placeholder={shouldMatch ? 'stringa che soddisfa...' : 'stringa che NON soddisfa...'}
              onChange={(e) => update(i, e.target.value)}
              aria-label={`${title} ${i + 1}`}
            />
            {status === true && <span className={styles.ok}>✓</span>}
            {status === false && <span className={styles.ko}>✗</span>}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => remove(i)}
              aria-label="Rimuovi"
            >
              ×
            </button>
          </div>
        )
      })}
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={add}
        disabled={items.length >= MAX_CONTROL}
      >
        + Aggiungi
      </button>
    </div>
  )
}

export default function CreateChallengePage() {
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [secretRegex, setSecretRegex] = useState('')
  const [exampleMatch, setExampleMatch] = useState('')
  const [exampleNoMatch, setExampleNoMatch] = useState('')
  const [positives, setPositives] = useState([''])
  const [negatives, setNegatives] = useState([''])
  const [errors, setErrors] = useState({})

  const re = compileRegex(secretRegex)
  const regexValid = secretRegex !== '' && re !== null

  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: challengesAPI.create,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] })
      queryClient.invalidateQueries({ queryKey: ['my-challenges'] })
      queryClient.invalidateQueries({ queryKey: ['me'] })
      navigate(`/sfide/${created.id}`)
    },
  })

  const validate = () => {
    const e = {}
    if (!title.trim()) e.title = 'Il titolo è obbligatorio'
    if (!secretRegex.trim()) e.secretRegex = 'La regex è obbligatoria'
    else if (!re) e.secretRegex = 'La regex non è sintatticamente valida'
    if (!exampleMatch.trim()) e.exampleMatch = 'Obbligatorio'
    else if (re && !re.test(exampleMatch)) e.exampleMatch = 'Questo esempio non soddisfa la regex'
    if (!exampleNoMatch.trim()) e.exampleNoMatch = 'Obbligatorio'
    else if (re && re.test(exampleNoMatch)) e.exampleNoMatch = 'Questo esempio soddisfa la regex (non dovrebbe)'

    const cleanPos = positives.map((s) => s).filter((s) => s !== '')
    const cleanNeg = negatives.map((s) => s).filter((s) => s !== '')
    if (cleanPos.length < 1) e.positives = 'Aggiungi almeno una stringa positiva'
    else if (re && cleanPos.some((s) => !re.test(s)))
      e.positives = 'Tutte le stringhe positive devono soddisfare la regex'
    if (cleanNeg.length < 1) e.negatives = 'Aggiungi almeno una stringa negativa'
    else if (re && cleanNeg.some((s) => re.test(s)))
      e.negatives = 'Nessuna stringa negativa deve soddisfare la regex'

    setErrors(e)
    return { ok: Object.keys(e).length === 0, cleanPos, cleanNeg }
  }

  const handleSubmit = (ev) => {
    ev.preventDefault()
    const { ok, cleanPos, cleanNeg } = validate()
    if (!ok) return
    mutation.mutate({
      title: title.trim(),
      description: description.trim() || null,
      secretRegex,
      exampleMatch,
      exampleNoMatch,
      controlStringsPositive: cleanPos,
      controlStringsNegative: cleanNeg,
    })
  }

  return (
    <main className="page">
      <div className="container" style={{ maxWidth: 760 }}>
        <header className="page-header">
          <h1 className="page-title">Nuova sfida</h1>
          <p className="page-subtitle">
            Definisci la regex segreta e le stringhe di controllo. Gli altri proveranno a indovinarla.
          </p>
        </header>

        {mutation.isError && (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
            {errorMessage(mutation.error, 'Creazione non riuscita')}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="stack">
          {/* 1. Info base */}
          <section className="card">
            <h3>1 · Informazioni</h3>
            <div className="field">
              <label className="label" htmlFor="title">
                Titolo
              </label>
              <input
                id="title"
                className={`input ${errors.title ? 'has-error' : ''}`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                aria-invalid={!!errors.title}
              />
              {errors.title && <span className="field-error">{errors.title}</span>}
            </div>
            <div className="field">
              <label className="label" htmlFor="description">
                Descrizione (opzionale)
              </label>
              <textarea
                id="description"
                className="textarea"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </section>

          {/* 2. Regex segreta */}
          <section className="card">
            <h3>2 · Regex segreta</h3>
            <div className="field">
              <label className="label" htmlFor="secretRegex">
                La tua regex (non sarà mai mostrata agli altri)
              </label>
              <input
                id="secretRegex"
                className={`input mono ${errors.secretRegex ? 'has-error' : ''}`}
                placeholder="^[a-z]+$"
                value={secretRegex}
                onChange={(e) => setSecretRegex(e.target.value)}
                aria-invalid={!!errors.secretRegex}
              />
              {errors.secretRegex ? (
                <span className="field-error">{errors.secretRegex}</span>
              ) : (
                secretRegex && (
                  <span className={regexValid ? styles.validHint : 'field-error'}>
                    {regexValid ? '✓ sintassi valida' : '✗ sintassi non valida'}
                  </span>
                )
              )}
            </div>
          </section>

          {/* 3. Esempi pubblici */}
          <section className="card">
            <h3>3 · Esempi pubblici</h3>
            <div className="field">
              <label className="label" htmlFor="exampleMatch">
                Stringa che soddisfa la regex
              </label>
              <input
                id="exampleMatch"
                className={`input mono ${errors.exampleMatch ? 'has-error' : ''}`}
                value={exampleMatch}
                onChange={(e) => setExampleMatch(e.target.value)}
                aria-invalid={!!errors.exampleMatch}
              />
              {errors.exampleMatch && <span className="field-error">{errors.exampleMatch}</span>}
            </div>
            <div className="field">
              <label className="label" htmlFor="exampleNoMatch">
                Stringa che NON soddisfa la regex
              </label>
              <input
                id="exampleNoMatch"
                className={`input mono ${errors.exampleNoMatch ? 'has-error' : ''}`}
                value={exampleNoMatch}
                onChange={(e) => setExampleNoMatch(e.target.value)}
                aria-invalid={!!errors.exampleNoMatch}
              />
              {errors.exampleNoMatch && <span className="field-error">{errors.exampleNoMatch}</span>}
            </div>
          </section>

          {/* 4-5. Stringhe di controllo */}
          <section className="card">
            <h3>4 · Stringhe di controllo</h3>
            <p className="muted" style={{ fontSize: '0.85rem' }}>
              Restano segrete e servono a verificare le soluzioni proposte. Le caselle si colorano in
              base alla regex inserita sopra.
            </p>
            <ControlList
              title="Positive"
              hint="Devono soddisfare la regex."
              items={positives}
              setItems={setPositives}
              testRegex={regexValid ? re : null}
              shouldMatch
            />
            {errors.positives && <span className="field-error">{errors.positives}</span>}
            <ControlList
              title="Negative"
              hint="NON devono soddisfare la regex."
              items={negatives}
              setItems={setNegatives}
              testRegex={regexValid ? re : null}
              shouldMatch={false}
            />
            {errors.negatives && <span className="field-error">{errors.negatives}</span>}
          </section>

          <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creazione...' : 'Crea sfida'}
          </button>
        </form>
      </div>
    </main>
  )
}
