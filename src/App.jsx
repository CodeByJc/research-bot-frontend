import { useMemo, useState, useRef } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
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

/* ===== SVG Icons ===== */
const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)

const AnalyzeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
)

const SpinnerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
)

const FileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
)

function App() {
  const [file, setFile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [analyzedAt, setAnalyzedAt] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const dropRef = useRef(null)
  const fileInputRef = useRef(null)

  const canSubmit = Boolean(file && !isLoading)

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0] ?? null
    setFile(selected)
    setError(null)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped && dropped.name.endsWith('.pdf')) {
      setFile(dropped)
      setError(null)
    } else {
      setError('Please drop a valid PDF file.')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!file) {
      setError('Please select a PDF file.')
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
        throw new Error(`Analysis failed. Please try again.`)
      }

      const data = await response.json()
      setResult(data)
      setAnalyzedAt(new Date())
    } catch (requestError) {
      setError('Server is under maintenance. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setResult(null)
    setError(null)
    setAnalyzedAt(null)
  }


  const summaryGoal = useMemo(
    () =>
      toDisplayText(
        result?.short_goal ?? result?.research_goal,
        '—',
      ),
    [result],
  )

  const summaryMethod = useMemo(
    () =>
      toDisplayText(
        result?.detailed_method ?? result?.research_methods ?? result?.raw_output,
        '—',
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
    <main className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-badge">
          <span className="badge-dot" />
          AI-Powered Analysis
        </div>
        <h1>
          Research Paper{' '}
          <span className="title-accent">Analyzer</span>
        </h1>
        <p className="header-subtitle">
          Upload a scientific paper and extract key insights, goals, and methodologies instantly.
        </p>
      </header>

      {/* Main Content */}
      <div className="main-content">
        {/* Upload Section */}
        {(!result && !isLoading) && (
          <section className="upload-panel">
            <form onSubmit={handleSubmit}>
              {!file ? (
                <div
                  className={`file-upload-box${isDragging ? ' dragging' : ''}`}
                  ref={dropRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current && fileInputRef.current.click() }}
                >
                  <div className="upload-icon-wrapper">
                    <UploadIcon />
                  </div>
                  <div className="upload-label-main">
                    <span>Click to browse</span> or drag & drop
                  </div>
                  <div className="upload-hint-text">PDF files only, up to 50 MB</div>
                  <input
                    id="pdf-input"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    disabled={isLoading}
                  />
                </div>
              ) : (
                <div className="file-selected-container">
                  <div className="file-selected-name">
                    <FileIcon />
                    {file.name}
                  </div>
                  <button
                    type="button"
                    className="remove-file-btn"
                    onClick={() => setFile(null)}
                    disabled={isLoading}
                  >
                    Remove File
                  </button>
                </div>
              )}

              <button
                id="analyze-button"
                className="analyze-btn"
                type="submit"
                disabled={!canSubmit}
              >
                <span className="btn-content">
                  {isLoading ? (
                    <>
                      <SpinnerIcon />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <AnalyzeIcon />
                      Analyze Paper
                    </>
                  )}
                </span>
              </button>

              {error && <div className="error-box">{error}</div>}
            </form>
          </section>
        )}

        {/* Loading State */}
        {isLoading && (
          <section className="loading-state">
            <div className="spinner-wrapper">
              <div className="spinner" />
            </div>
            <p>Processing your research paper…</p>
          </section>
        )}

        {/* Results Section */}
        {result && !isLoading && (
          <section className="results-panel">
            <div className="results-header">
              <span className="result-status">
                <span className="status-icon">✓</span>
                Analysis Complete
              </span>
              <div className="header-actions">
                {analyzedAt && (
                  <span className="result-time">{analyzedAt.toLocaleTimeString()}</span>
                )}
                <button className="reset-btn" onClick={handleReset} type="button">
                  New Analysis
                </button>
              </div>
            </div>

            <div className="results-stack">
              <article className="result-item">
                <h3>Research Goal</h3>
                <p>{summaryGoal}</p>
              </article>

              <article className="result-item">
                <h3>Methodology</h3>
                <p>{summaryMethod}</p>
              </article>

              {additionalFields.map(([key, value]) => (
                <article className="result-item" key={key}>
                  <h3>{formatResultLabel(key)}</h3>
                  <p>{toDisplayText(value, '—')}</p>
                </article>
              ))}

              {result?.raw_output && (
                <article className="result-item raw-output-item">
                  <h3>Raw Output</h3>
                  <pre>{toDisplayText(result.raw_output, '—')}</pre>
                </article>
              )}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!result && !isLoading && (
          <section className="empty-state-section">
            <div className="empty-message">
              <div className="empty-icon">📄</div>
              <p>No results yet</p>
              <span>Upload a PDF above to start analysis</span>
            </div>
          </section>
        )}
      </div>

      <footer className="app-footer">
        <div className="footer-credits">
          Research Paper Analyzer — By{' '}
          <a href="https://in.linkedin.com/in/jaineel-chhatraliya" target="_blank" rel="noopener noreferrer" className="footer-link">
            Jaineel Chhatraliya
          </a>
          <span className="footer-separator">&</span>
          <a href="https://github.com/ommakadiya" target="_blank" rel="noopener noreferrer" className="footer-link">
            Om Makadiya
          </a>
        </div>
      </footer>
    </main>
  )
}

export default App