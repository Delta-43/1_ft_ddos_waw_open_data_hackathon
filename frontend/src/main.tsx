import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

function App() {
  const [query, setQuery] = useState('A quiet, green museum outing');
  const [result, setResult] = useState('No request yet.');
  const [busy, setBusy] = useState(false);
  return <main><h1>Warsaw 2076</h1><p>Integration starter — synthetic route data only.</p>
    <form onSubmit={async event => {
      event.preventDefault(); setBusy(true);
      try {
        const response = await fetch('/api/routes', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({query}) });
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);
        setResult(JSON.stringify(await response.json(), null, 2));
      } catch (error) { setResult(String(error)); }
      finally { setBusy(false); }
    }}><label>Your outing <input required maxLength={1000} value={query} onChange={event => setQuery(event.target.value)} /></label>
    <button disabled={busy}>{busy ? 'Loading…' : 'Request demo route'}</button></form>
    <pre aria-live="polite">{result}</pre></main>;
}
createRoot(document.getElementById('root')!).render(<App />);
