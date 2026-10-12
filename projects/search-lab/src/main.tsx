import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SAMPLE_DOCUMENTS, LIMITS } from '../shared/search.mjs';
import './style.css';
type Doc = { id: string; title: string; text: string };
type Match = { term: string; frequency: number; documentFrequency: number; contribution: number };
type Result = Doc & { score: number; matches: Match[] };
type ResponseData = { query: string; terms: string[]; documentCount: number; results: Result[]; algorithm: { k1: number; b: number; averageLength: number } };
function App() {
  const [documents, setDocuments] = useState<Doc[]>(SAMPLE_DOCUMENTS);
  const [query, setQuery] = useState('reproducible experiments');
  const [data, setData] = useState<ResponseData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [elapsed, setElapsed] = useState(0);
  async function runSearch(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setData(null);
    const start = performance.now();
    try {
      const response = await fetch('/api/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, documents }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Search failed.');
      setData(body); setElapsed(Math.round(performance.now() - start));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to connect. Try again.'); }
    finally { setBusy(false); }
  }
  function addDocument(event: React.FormEvent) {
    event.preventDefault();
    if (documents.length >= LIMITS.documents) { setError('The collection is full (40 documents maximum).'); return; }
    setDocuments([...documents, { id: `custom-${crypto.randomUUID()}`, title: title.trim(), text: text.trim() }]);
    setTitle(''); setText(''); setData(null); setError('');
  }
  return <>
    <header><a href="/" className="wordmark">MA<span> / </span>DOCUMENT SEARCH LAB</a><a href="https://github.com/mahdi-alam360/portfolio/tree/main/projects/search-lab" target="_blank" rel="noreferrer">Source code ↗</a></header>
    <main>
      <section className="intro"><p className="eyebrow">A SMALL EXPERIMENT IN RETRIEVAL</p><h1>Find the signal.<br/><em>See the reasoning.</em></h1><p className="lede">Search a collection of notes with BM25. Inspect the terms behind every match, or add a document of your own.</p><div className="tags"><span>React + TypeScript</span><span>Node.js API</span><span>Lexical retrieval</span></div></section>
      <div className="workspace"><aside>
        <div className="section-label"><h2>Collection</h2><span>{documents.length} documents</span></div>
        <p className="muted">Sample notes written for this demo. Your additions stay in this tab and are sent to the search API when you search. Please use non-sensitive text.</p>
        <ul className="documents">{documents.map(doc => <li key={doc.id}><span>{doc.title}</span><button aria-label={`Remove ${doc.title}`} onClick={() => { setDocuments(documents.filter(d => d.id !== doc.id)); setData(null); }}>×</button></li>)}</ul>
        <details><summary>Add your own document</summary><form onSubmit={addDocument} className="add-form"><label htmlFor="title">Title</label><input id="title" value={title} onChange={e => setTitle(e.target.value)} maxLength={200} required pattern=".*\S.*"/><label htmlFor="document">Document text</label><textarea id="document" value={text} onChange={e => setText(e.target.value)} maxLength={8000} required rows={5}/><button className="secondary" disabled={!title.trim() || !text.trim() || documents.length >= 40}>Add to collection</button></form></details>
        <button className="reset" onClick={() => { setDocuments(SAMPLE_DOCUMENTS); setData(null); setError(''); }}>Restore sample collection ↺</button>
      </aside><section className="search-area" aria-label="Search documents">
        <form onSubmit={runSearch}><label className="search-label" htmlFor="query">What are you looking for?</label><div className="query-row"><input id="query" value={query} onChange={e => setQuery(e.target.value)} placeholder="Try: reproducible experiments" maxLength={200} required/><button className="primary" disabled={busy || !documents.length}>{busy ? 'Searching…' : 'Search →'}</button></div></form>
        <div className="suggestions"><span>TRY</span>{['image registration', 'React interface', 'retrieval quality'].map(q => <button key={q} onClick={() => { setQuery(q); setData(null); }}>{q}</button>)}</div>
        <div role="status" aria-live="polite">{busy && <p className="muted">Ranking your collection…</p>}{error && <p className="error">{error}</p>}{data && <div className="results-heading"><h2>{data.results.length} {data.results.length === 1 ? 'match' : 'matches'}</h2><span>{elapsed} ms round trip · {data.documentCount} documents</span></div>}</div>
        {!data && !busy && !error && <div className="empty"><span className="empty-icon">⌕</span><h2>A good question is a good start.</h2><p>Run a search to explore your collection.<br/>Each result includes a transparent score breakdown.</p></div>}
        {data && data.results.length === 0 && <div className="empty"><h2>No matching terms.</h2><p>Try words that appear in your collection. BM25 matches words, so it can miss synonyms and semantic relationships.</p></div>}
        {data?.results.map((result, index) => <article className="result" key={result.id}><div className="result-title"><span className="rank">{String(index + 1).padStart(2, '0')}</span><h3>{result.title}</h3><span className="score">{result.score.toFixed(3)} <small>BM25</small></span></div><p>{result.text}</p><details><summary>Why this matched <span>{result.matches.map(m => m.term).join(' · ')}</span></summary><div className="table-wrap"><table><thead><tr><th>Term</th><th>Occurrences</th><th>Docs with term</th><th>Contribution</th></tr></thead><tbody>{result.matches.map(m => <tr key={m.term}><td>{m.term}</td><td>{m.frequency}</td><td>{m.documentFrequency}</td><td>{m.contribution.toFixed(3)}</td></tr>)}</tbody></table></div></details></article>)}
        <div className="method"><p className="eyebrow">UNDER THE HOOD</p><p>BM25 rewards rare matching terms, saturates repeated terms, and adjusts for document length. Titles and body text are tokenized together. Parameters: k₁ = 1.2, b = 0.75.</p><p>This is an AI-assisted personal learning project by Mahdi Alam. Scores measure lexical relevance, not correctness or confidence. No LLM, persistent storage, or production-readiness claim.</p></div>
      </section></div>
    </main><footer><span>Built by <a href="/">Mahdi Alam</a> · October 2026</span><span>Small scope. Visible tradeoffs.</span></footer>
  </>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
