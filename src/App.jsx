import { useMemo, useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
const RESULT_LABELS = {
  short_goal: 'Research Goal',
  detailed_method: 'Detailed Method',
  research_goal: 'Research Goal',
  research_methods: 'Research Methods',
  dataset_used: 'Dataset Used',
  key_contributions: 'Key Contributions',
  raw_output: 'Raw Output',
}

const formatResultLabel = (key) => {
  if (RESULT_LABELS[key]) {
    return RESULT_LABELS[key]
  }

  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

const toDisplayText = (value, fallback) => {
  if (value === null || value === undefined) {
    return fallback
  }

  if (typeof value === 'string') {
    return value.trim() ? value : fallback
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return fallback
    }
  }

  return String(value)
}

function App() {
  const [file, setFile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [analyzedAt, setAnalyzedAt] = useState(null)

  const selectedFileSize = useMemo(() => {
    if (!file) {
      return null
    }

    return `${(file.size / (1024 * 1024)).toFixed(2)} MB`
  }, [file])

  const canSubmit = Boolean(file && !isLoading)

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!file) {
      setError('Please select a PDF before analyzing.')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)
    setAnalyzedAt(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const data = await response.json()
      setResult(data)
      setAnalyzedAt(new Date())
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Something went wrong while contacting the backend.'

      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const summaryGoal = useMemo(
    () =>
      toDisplayText(
        result?.short_goal ?? result?.research_goal,
        'No research goal available from the current result.',
      ),
    [result],
  )

  const summaryMethod = useMemo(
    () =>
      toDisplayText(
        result?.detailed_method ?? result?.research_methods ?? result?.raw_output,
        'No detailed method available from the current result.',
      ),
    [result],
  )

  const additionalFields = useMemo(() => {
    if (!result || typeof result !== 'object') {
      return []
    }

    return Object.entries(result).filter(
      ([key]) => !['short_goal', 'research_goal', 'detailed_method', 'research_methods', 'raw_output'].includes(key),
    )
  }, [result])

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="hero-content">
          <p className="eyebrow">Research Intelligence Studio</p>
          <h1>Upload a paper and get a structured scientific summary</h1>
          <p className="subtitle">
            Designed for fast literature triage: parse the PDF, extract the research goal,
            and inspect the methodology details in one clean workspace.
          </p>
        </div>

        <form className="upload-card" onSubmit={handleSubmit}>
          <label className="file-picker" htmlFor="paper-upload">
            <span className="file-picker-title">Select PDF</span>
            <span className="file-picker-hint">Drop or browse one research paper file.</span>
            <input
              id="paper-upload"
              type="file"
              accept="application/pdf"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>

          <div className="upload-meta">
            <div>
              <span className="meta-label">Selected file</span>
              <strong>{file ? file.name : 'No file selected'}</strong>
            </div>
            <div>
              <span className="meta-label">File size</span>
              <strong>{selectedFileSize ?? '—'}</strong>
            </div>
          </div>

          <button className="analyze-button" type="submit" disabled={!canSubmit}>
            {isLoading ? 'Analyzing Paper...' : 'Run Analysis'}
          </button>

          {error && <section className="message error">{error}</section>}
        </form>
      </section>

      <section className="results-section">
        <div className="section-heading">
          <h2>Analysis Results</h2>
          <p>
            {analyzedAt
              ? `Last updated ${analyzedAt.toLocaleString()}`
              : 'Run an analysis to populate structured results.'}
          </p>
        </div>

        {!result && (
          <article className="empty-state">
            <h3>No results yet</h3>
            <p>
              Upload a PDF and start analysis. Structured fields from the backend response
              will appear here automatically.
            </p>
          </article>
        )}

        {result && (
          <div className="results-grid">
            <article className="result-card goal">
              <div className="card-header">
                <span>Research Goal</span>
              </div>
              <p>{summaryGoal}</p>
            </article>

            <article className="result-card large method">
              <div className="card-header">
                <span>Detailed Method</span>
              </div>
              <p>{summaryMethod}</p>
            </article>

            {additionalFields.map(([key, value]) => (
              <article className="result-card" key={key}>
                <div className="card-header">
                  <span>{formatResultLabel(key)}</span>
                </div>
                <p>{toDisplayText(value, 'No value available.')}</p>
              </article>
            ))}

            {result?.raw_output && (
              <article className="result-card large raw-output">
                <div className="card-header">
                  <span>Raw Model Output</span>
                </div>
                <pre>{toDisplayText(result.raw_output, 'No raw output available.')}</pre>
              </article>
            )}
          </div>
        )}
      </section>
    </main>
  )
}

export default App